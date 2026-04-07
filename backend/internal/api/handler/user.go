package handler

import (
	"context"
	"net/http"
	"time"

	"backend/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserHandler struct {
	db *pgxpool.Pool
}

func NewUserHandler(db *pgxpool.Pool) *UserHandler {
	return &UserHandler{db: db}
}

// GetUserProfile history and summary
func (h *UserHandler) GetUserProfile(c *gin.Context) {
	// Extract user ID from middleware context
	userIDValue, exists := c.Get("userID")
	if !exists {
		response.Error(c, http.StatusUnauthorized, "User unauthorized")
		return
	}
	userID := userIDValue.(int)

	var user struct {
		Name       string `json:"name"`
		TotalScore int    `json:"total_score"`
	}

	err := h.db.QueryRow(context.Background(), "SELECT name, total_score FROM users WHERE id = $1", userID).Scan(&user.Name, &user.TotalScore)
	if err != nil {
		response.Error(c, http.StatusNotFound, "User not found")
		return
	}

	rows, err := h.db.Query(context.Background(),
		`SELECT a.id, a.question_id, a.chosen_option_id, q.question_text, a.predicted_correct_count, a.score, a.created_at
		 FROM answers a
		 JOIN questions q ON a.question_id = q.id
		 WHERE a.user_id = $1
		 ORDER BY a.created_at DESC LIMIT 50`, userID)

	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to fetch answer history")
		return
	}
	defer rows.Close()

	type HistoryEntry struct {
		AnswerID     int    `json:"answer_id"`
		QuestionID   int    `json:"question_id"`
		ChosenOption int    `json:"chosen_option_id"`
		Question     string `json:"question"`
		Prediction   int    `json:"prediction"`
		Score        int    `json:"score"`
		Date         string `json:"date"`
	}

	var history []HistoryEntry
	for rows.Next() {
		var entry HistoryEntry
		var created time.Time
		if err := rows.Scan(&entry.AnswerID, &entry.QuestionID, &entry.ChosenOption, &entry.Question, &entry.Prediction, &entry.Score, &created); err == nil {
			entry.Date = created.Format("2006-01-02")
			history = append(history, entry)
		}
	}

	if history == nil {
		history = []HistoryEntry{}
	}

	response.Success(c, http.StatusOK, "Profile retrieved", gin.H{
		"user":    user,
		"history": history,
	})
}
