package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"backend/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type LeaderboardHandler struct {
	db  *pgxpool.Pool
	rdb *redis.Client
}

func NewLeaderboardHandler(db *pgxpool.Pool, rdb *redis.Client) *LeaderboardHandler {
	return &LeaderboardHandler{db: db, rdb: rdb}
}

// GetDailyLeaderboard retrieves leaderboard for a specific date and program
func (h *LeaderboardHandler) GetDailyLeaderboard(c *gin.Context) {
	date := c.Query("date") // expected Format YYYY-MM-DD

	if date == "" {
		response.Error(c, http.StatusBadRequest, "Missing date")
		return
	}

	type LeaderboardEntry struct {
		UserID     int     `json:"user_id"`
		Name       string  `json:"name"`
		Avatar     *string `json:"avatar"`
		DailyScore int     `json:"daily_score"`
	}

	cacheKey := fmt.Sprintf("leaderboard:daily:%s", date)
	cached, err := h.rdb.Get(context.Background(), cacheKey).Result()
	if err == nil && cached != "" {
		var leaderboard []LeaderboardEntry
		if json.Unmarshal([]byte(cached), &leaderboard) == nil {
			response.Success(c, http.StatusOK, "Daily leaderboard retrieved (cached)", leaderboard)
			return
		}
	}

	rows, err := h.db.Query(context.Background(),
		`SELECT u.id, u.name, u.avatar, l.daily_score 
		 FROM leaderboards l
		 JOIN users u ON l.user_id = u.id
		 WHERE l.date = $1
		 ORDER BY l.daily_score DESC LIMIT 100`,
		date)

	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to retrieve leaderboard")
		return
	}
	defer rows.Close()

	var leaderboard []LeaderboardEntry
	for rows.Next() {
		var entry LeaderboardEntry
		if err := rows.Scan(&entry.UserID, &entry.Name, &entry.Avatar, &entry.DailyScore); err == nil {
			leaderboard = append(leaderboard, entry)
		}
	}

	if leaderboard == nil {
		leaderboard = []LeaderboardEntry{}
	}

	if bytes, err := json.Marshal(leaderboard); err == nil {
		h.rdb.Set(context.Background(), cacheKey, bytes, 0)
	}

	response.Success(c, http.StatusOK, "Daily leaderboard retrieved", leaderboard)
}

// GetOverallLeaderboard retrieves across all dates
func (h *LeaderboardHandler) GetOverallLeaderboard(c *gin.Context) {

	type LeaderboardEntry struct {
		UserID     int     `json:"user_id"`
		Name       string  `json:"name"`
		Avatar     *string `json:"avatar"`
		TotalScore int     `json:"total_score"`
	}

	cacheKey := "leaderboard:overall"
	cached, err := h.rdb.Get(context.Background(), cacheKey).Result()
	if err == nil && cached != "" {
		var leaderboard []LeaderboardEntry
		if json.Unmarshal([]byte(cached), &leaderboard) == nil {
			response.Success(c, http.StatusOK, "Overall leaderboard retrieved (cached)", leaderboard)
			return
		}
	}

	// Calculate overall dynamically or via materialized tables. Dynamically here:
	rows, err := h.db.Query(context.Background(),
		`SELECT u.id, u.name, u.avatar, SUM(l.daily_score) as total_score
		 FROM leaderboards l
		 JOIN users u ON l.user_id = u.id
		 GROUP BY u.id, u.name, u.avatar
		 ORDER BY total_score DESC LIMIT 100`)

	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to retrieve overall leaderboard")
		return
	}
	defer rows.Close()

	var leaderboard []LeaderboardEntry
	for rows.Next() {
		var entry LeaderboardEntry
		if err := rows.Scan(&entry.UserID, &entry.Name, &entry.Avatar, &entry.TotalScore); err == nil {
			leaderboard = append(leaderboard, entry)
		}
	}

	if leaderboard == nil {
		leaderboard = []LeaderboardEntry{}
	}

	if bytes, err := json.Marshal(leaderboard); err == nil {
		h.rdb.Set(context.Background(), cacheKey, bytes, 0)
	}

	response.Success(c, http.StatusOK, "Overall leaderboard retrieved", leaderboard)
}
