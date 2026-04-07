package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"backend/internal/model"
	"backend/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type GameHandler struct {
	db  *pgxpool.Pool
	rdb *redis.Client
}

func NewGameHandler(db *pgxpool.Pool, rdb *redis.Client) *GameHandler {
	return &GameHandler{db: db, rdb: rdb}
}

// GetTodayQuestions retrieves questions active for today
func (h *GameHandler) GetTodayQuestions(c *gin.Context) {
	today := time.Now().Format("2006-01-02")
	cacheKey := "game:questions:today:" + today

	// Check cache first
	cached, err := h.rdb.Get(context.Background(), cacheKey).Result()
	if err == nil && cached != "" {
		var questions []model.Question
		if json.Unmarshal([]byte(cached), &questions) == nil {
			response.Success(c, http.StatusOK, "Today's questions fetched (cached)", questions)
			return
		}
	}

	rows, err := h.db.Query(context.Background(),
		"SELECT id, question_text, options, active_date FROM questions WHERE active_date = $1", today)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to fetch questions")
		return
	}
	defer rows.Close()

	var questions []model.Question
	for rows.Next() {
		var q model.Question
		if err := rows.Scan(&q.ID, &q.QuestionText, &q.Options, &q.ActiveDate); err == nil {
			questions = append(questions, q)
		} else {
			log.Printf("GetTodayQuestions scan error: %v", err)
		}
	}

	if questions == nil {
		questions = []model.Question{}
	}

	// Save to cache for 24h
	if bytes, err := json.Marshal(questions); err == nil {
		h.rdb.Set(context.Background(), cacheKey, bytes, 24*time.Hour)
	}

	response.Success(c, http.StatusOK, "Today's questions fetched", questions)
}

// SubmitAnswer allows the user to submit chosen options for all questions and predict correctly once for the day
func (h *GameHandler) SubmitAnswer(c *gin.Context) {
	var req struct {
		Answers []struct {
			QuestionID     int `json:"question_id"`
			ChosenOptionID int `json:"chosen_option_id"`
		} `json:"answers"`
		PredictedCorrectCount int `json:"predicted_correct_count"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid payload")
		return
	}

	userIDValue, exists := c.Get("userID")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "User unauthorized")
		return
	}
	userID := userIDValue.(int)

	roleValue, exists := c.Get("role")
	log.Printf("SubmitAnswer Role Check: exists=%v, value=%v", exists, roleValue)
	if exists && roleValue.(string) == "admin" {
		response.Error(c, http.StatusForbidden, "Admin account cannot play the game. Please use a regular Facebook/Google player account.")
		return
	}

	if len(req.Answers) == 0 {
		response.Error(c, http.StatusBadRequest, "No answers provided")
		return
	}

	tx, err := h.db.Begin(context.Background())
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to process submission")
		return
	}
	defer tx.Rollback(context.Background())

	for _, ans := range req.Answers {
		// Insert answer, no ON CONFLICT to avoid overwriting (allow only 1 submission)
		_, err := tx.Exec(context.Background(),
			`INSERT INTO answers (user_id, question_id, chosen_option_id, predicted_correct_count) 
			 VALUES ($1, $2, $3, $4)`,
			userID, ans.QuestionID, ans.ChosenOptionID, req.PredictedCorrectCount,
		)

		if err != nil {
			log.Printf("DB Exec error while inserting answer (User: %d, Q: %d): %v", userID, ans.QuestionID, err)
			// Return a more descriptive error based on string matching or just generic internal error to avoid confusing users with "already submitted"
			if strings.Contains(err.Error(), "foreign key constraint") {
				response.Error(c, http.StatusInternalServerError, "Account not valid for playing.")
			} else if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
				response.Error(c, http.StatusConflict, "You have already submitted an answer for one or more questions.")
			} else {
				response.Error(c, http.StatusInternalServerError, "Database error: Cannot save answer.")
			}
			return
		}
	}

	if err := tx.Commit(context.Background()); err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to save answers")
		return
	}

	response.Success(c, http.StatusOK, "Answers recorded securely. Good luck!", nil)
}

// GetPrizes returns today's prizes and grand prizes
func (h *GameHandler) GetPrizes(c *gin.Context) {
	today := time.Now().Format("2006-01-02")
	var prizes []model.Prize

	rows, err := h.db.Query(context.Background(),
		"SELECT id, date, name, description, prize_type FROM prizes WHERE date = $1 OR prize_type = 'grand'", today)
	if err != nil {
		log.Printf("GetPrizes query err: %v", err)
		response.Error(c, http.StatusInternalServerError, "Failed to fetch prizes")
		return
	}
	defer rows.Close()

	for rows.Next() {
		var p model.Prize
		if err := rows.Scan(&p.ID, &p.Date, &p.Name, &p.Description, &p.PrizeType); err == nil {
			prizes = append(prizes, p)
		}
	}

	if prizes == nil {
		prizes = []model.Prize{}
	}

	response.Success(c, http.StatusOK, "Prizes fetched", prizes)
}

// GetYesterdaySummary returns the user's performance summary for yesterday
func (h *GameHandler) GetYesterdaySummary(c *gin.Context) {
	userIDValue, _ := c.Get("userID")
	userID := userIDValue.(int)

	yesterday := time.Now().AddDate(0, 0, -1).Format("2006-01-02")

	var summary struct {
		CorrectCount int    `json:"correct_count"`
		Rank         int    `json:"rank"`
		PrizeName    string `json:"prize_name"`
	}

	// Get rank and score from leaderboards table for yesterday
	err := h.db.QueryRow(context.Background(),
		`SELECT daily_score, 
		 (SELECT COUNT(*) + 1 FROM leaderboards WHERE date = $1 AND daily_score > l.daily_score) as rank
		 FROM leaderboards l 
		 WHERE user_id = $2 AND date = $1`,
		yesterday, userID,
	).Scan(&summary.CorrectCount, &summary.Rank)

	if err != nil {
		// Not found is fine, just means user didn't participate or scores not computed yet
		summary.Rank = 0
		summary.CorrectCount = 0
	}

	response.Success(c, http.StatusOK, "Yesterday summary fetched", summary)
}
