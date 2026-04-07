package handler

import (
	"context"
	"fmt"
	"net/http"

	"backend/internal/model"
	"backend/internal/service"
	"backend/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type AdminHandler struct {
	db           *pgxpool.Pool
	rdb          *redis.Client
	scoreService *service.ScoreService
}

func NewAdminHandler(db *pgxpool.Pool, rdb *redis.Client, scoreService *service.ScoreService) *AdminHandler {
	return &AdminHandler{db: db, rdb: rdb, scoreService: scoreService}
}

// QUESTION endpoints
func (h *AdminHandler) CreateQuestion(c *gin.Context) {
	var req struct {
		QuestionText    string   `json:"question_text"`
		Options         []string `json:"options"`
		CorrectOptionID *int     `json:"correct_option_id"`
		ActiveDate      string   `json:"active_date"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid payload")
		return
	}

	var q model.Question
	err := h.db.QueryRow(context.Background(),
		"INSERT INTO questions (question_text, options, correct_option_id, active_date) VALUES ($1, $2, $3, $4) RETURNING id",
		req.QuestionText, req.Options, req.CorrectOptionID, req.ActiveDate,
	).Scan(&q.ID)

	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to create question")
		return
	}

	h.rdb.Del(context.Background(), fmt.Sprintf("questions:today:%s", req.ActiveDate))

	response.Success(c, http.StatusCreated, "Question created", gin.H{"id": q.ID})
}

func (h *AdminHandler) ListQuestions(c *gin.Context) {
	rows, err := h.db.Query(context.Background(), "SELECT id, question_text, options, correct_option_id, active_date, created_at FROM questions ORDER BY active_date DESC, id ASC")
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to retrieve questions")
		return
	}
	defer rows.Close()

	var questions []model.Question
	for rows.Next() {
		var q model.Question
		if err := rows.Scan(&q.ID, &q.QuestionText, &q.Options, &q.CorrectOptionID, &q.ActiveDate, &q.CreatedAt); err == nil {
			questions = append(questions, q)
		}
	}

	if questions == nil {
		questions = []model.Question{}
	}

	response.Success(c, http.StatusOK, "Questions retrieved", questions)
}

func (h *AdminHandler) UpdateQuestion(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		QuestionText    string   `json:"question_text"`
		Options         []string `json:"options"`
		CorrectOptionID *int     `json:"correct_option_id"`
		ActiveDate      string   `json:"active_date"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid payload")
		return
	}

	// Calculate if date allows updating
	var activeDate string
	err := h.db.QueryRow(context.Background(), "SELECT active_date FROM questions WHERE id = $1", id).Scan(&activeDate)
	if err != nil {
		response.Error(c, http.StatusNotFound, "Question not found")
		return
	}

	tag, err := h.db.Exec(context.Background(),
		"UPDATE questions SET question_text = $1, options = $2, correct_option_id = $3, active_date = $4 WHERE id = $5 AND active_date >= CURRENT_DATE",
		req.QuestionText, req.Options, req.CorrectOptionID, req.ActiveDate, id,
	)

	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to update question")
		return
	}

	if tag.RowsAffected() == 0 {
		response.Error(c, http.StatusForbidden, "Cannot update question: It may not exist or its active date is in the past")
		return
	}

	dateStr := activeDate
	if len(activeDate) > 10 {
		dateStr = activeDate[:10]
	}
	h.rdb.Del(context.Background(),
		fmt.Sprintf("questions:today:%s", dateStr),
		fmt.Sprintf("questions:today:%s", req.ActiveDate),
	)

	response.Success(c, http.StatusOK, "Question updated", nil)
}

func (h *AdminHandler) DeleteQuestion(c *gin.Context) {
	id := c.Param("id")

	var activeDate string
	err := h.db.QueryRow(context.Background(), "SELECT active_date FROM questions WHERE id = $1", id).Scan(&activeDate)
	if err != nil {
		response.Error(c, http.StatusNotFound, "Question not found")
		return
	}

	tag, err := h.db.Exec(context.Background(), "DELETE FROM questions WHERE id = $1 AND active_date >= CURRENT_DATE", id)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to delete question")
		return
	}

	if tag.RowsAffected() == 0 {
		response.Error(c, http.StatusForbidden, "Cannot delete question: It may not exist or its active date is in the past")
		return
	}

	dateStr := activeDate
	if len(activeDate) > 10 {
		dateStr = activeDate[:10]
	}
	h.rdb.Del(context.Background(), fmt.Sprintf("questions:today:%s", dateStr))

	response.Success(c, http.StatusOK, "Question deleted", nil)
}

// PRIZE endpoints
func (h *AdminHandler) CreatePrize(c *gin.Context) {
	var req struct {
		Date        *string `json:"date"` // YYYY-MM-DD
		Name        string  `json:"name"`
		Description string  `json:"description"`
		PrizeType   string  `json:"prize_type"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid payload")
		return
	}

	if req.Date != nil && *req.Date == "" {
		req.Date = nil
	}

	if req.PrizeType == "daily" && req.Date != nil {
		var count int
		err := h.db.QueryRow(context.Background(), "SELECT COUNT(*) FROM prizes WHERE date = $1 AND prize_type = 'daily'", req.Date).Scan(&count)
		if err == nil && count > 0 {
			response.Error(c, http.StatusConflict, "Đã có giải thưởng ngày cho ngày này. Mỗi ngày chỉ được tạo một giải thưởng.")
			return
		}
	} else if req.PrizeType == "grand" {
		var count int
		err := h.db.QueryRow(context.Background(), "SELECT COUNT(*) FROM prizes WHERE prize_type = 'grand'").Scan(&count)
		if err == nil && count > 0 {
			response.Error(c, http.StatusConflict, "Đã có giải thưởng chung cuộc. Chỉ được phép tạo một giải thưởng chung cuộc duy nhất.")
			return
		}
	}

	var p model.Prize
	err := h.db.QueryRow(context.Background(),
		"INSERT INTO prizes (date, name, description, prize_type) VALUES ($1, $2, $3, $4) RETURNING id",
		req.Date, req.Name, req.Description, req.PrizeType,
	).Scan(&p.ID)

	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to create prize")
		return
	}

	response.Success(c, http.StatusCreated, "Prize created", gin.H{"id": p.ID})
}

func (h *AdminHandler) ListPrizes(c *gin.Context) {
	rows, err := h.db.Query(context.Background(), "SELECT id, date, name, description, prize_type FROM prizes ORDER BY date DESC, id DESC")
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to retrieve prizes")
		return
	}
	defer rows.Close()

	var prizes []model.Prize
	for rows.Next() {
		var p model.Prize
		if err := rows.Scan(&p.ID, &p.Date, &p.Name, &p.Description, &p.PrizeType); err == nil {
			prizes = append(prizes, p)
		} else {
			// log the error if scan fails
			fmt.Println("Scan error:", err)
		}
	}

	if prizes == nil {
		prizes = []model.Prize{}
	}

	fmt.Println("Returning prizes:", len(prizes))
	response.Success(c, http.StatusOK, "Prizes retrieved", prizes)
}

func (h *AdminHandler) UpdatePrize(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Date        *string `json:"date"`
		Name        string  `json:"name"`
		Description string  `json:"description"`
		PrizeType   string  `json:"prize_type"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid payload")
		return
	}

	if req.Date != nil && *req.Date == "" {
		req.Date = nil
	}

	if req.PrizeType == "daily" && req.Date != nil {
		var count int
		err := h.db.QueryRow(context.Background(), "SELECT COUNT(*) FROM prizes WHERE date = $1 AND prize_type = 'daily' AND id != $2", req.Date, id).Scan(&count)
		if err == nil && count > 0 {
			response.Error(c, http.StatusConflict, "Đã có giải thưởng ngày cho ngày này. Mỗi ngày chỉ được tạo một giải thưởng.")
			return
		}
	} else if req.PrizeType == "grand" {
		var count int
		err := h.db.QueryRow(context.Background(), "SELECT COUNT(*) FROM prizes WHERE prize_type = 'grand' AND id != $1", id).Scan(&count)
		if err == nil && count > 0 {
			response.Error(c, http.StatusConflict, "Đã có giải thưởng chung cuộc. Chỉ được phép tạo một giải thưởng chung cuộc duy nhất.")
			return
		}
	}

	tag, err := h.db.Exec(context.Background(),
		"UPDATE prizes SET date = $1, name = $2, description = $3, prize_type = $4 WHERE id = $5",
		req.Date, req.Name, req.Description, req.PrizeType, id,
	)

	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to update prize")
		return
	}

	if tag.RowsAffected() == 0 {
		response.Error(c, http.StatusNotFound, "Prize not found")
		return
	}

	response.Success(c, http.StatusOK, "Prize updated", nil)
}

func (h *AdminHandler) DeletePrize(c *gin.Context) {
	id := c.Param("id")

	tag, err := h.db.Exec(context.Background(), "DELETE FROM prizes WHERE id = $1", id)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to delete prize")
		return
	}

	if tag.RowsAffected() == 0 {
		response.Error(c, http.StatusNotFound, "Prize not found")
		return
	}

	response.Success(c, http.StatusOK, "Prize deleted", nil)
}
