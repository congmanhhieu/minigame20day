package model

import "time"

type User struct {
	ID         int       `json:"id" db:"id"`
	ExternalID *string   `json:"external_id" db:"external_id"`
	Provider   *string   `json:"provider" db:"provider"`
	Name       string    `json:"name" db:"name"`
	Email      *string   `json:"email" db:"email"`
	Avatar     *string   `json:"avatar" db:"avatar"`
	Role       string    `json:"role" db:"role"`
	TotalScore int       `json:"total_score" db:"total_score"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

type Question struct {
	ID              int       `json:"id" db:"id"`
	QuestionText    string    `json:"question_text" db:"question_text"`
	Options         []string  `json:"options" db:"options"` // Use helper for jsonb mapping or map directly if pgx supports slices -> jsonb array
	CorrectOptionID *int      `json:"correct_option_id" db:"correct_option_id"`
	ActiveDate      time.Time `json:"active_date" db:"active_date"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
}

type Answer struct {
	ID                    int       `json:"id" db:"id"`
	UserID                int       `json:"user_id" db:"user_id"`
	QuestionID            int       `json:"question_id" db:"question_id"`
	ChosenOptionID        int       `json:"chosen_option_id" db:"chosen_option_id"`
	PredictedCorrectCount int       `json:"predicted_correct_count" db:"predicted_correct_count"`
	Score                 int       `json:"score" db:"score"`
	CreatedAt             time.Time `json:"created_at" db:"created_at"`
}

type Leaderboard struct {
	ID           int       `json:"id" db:"id"`
	UserID       int       `json:"user_id" db:"user_id"`
	Date         time.Time `json:"date" db:"date"`
	DailyScore   int       `json:"daily_score" db:"daily_score"`
	OverallScore int       `json:"overall_score" db:"overall_score"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

type Prize struct {
	ID          int        `json:"id" db:"id"`
	Date        *time.Time `json:"date" db:"date"`
	Name        string     `json:"name" db:"name"`
	Description *string    `json:"description" db:"description"`
	PrizeType   string     `json:"prize_type" db:"prize_type"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
}
