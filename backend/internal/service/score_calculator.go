package service

import (
	"context"
	"fmt"
	"log"
	"math"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ScoreService struct {
	db *pgxpool.Pool
}

func NewScoreService(db *pgxpool.Pool) *ScoreService {
	return &ScoreService{db: db}
}

func (s *ScoreService) CalculateDailyScores(ctx context.Context, date string) error {
	log.Printf("Starting daily score calculation on %s", date)

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// 1. Fetch all questions for today
	var questions []struct {
		ID              int
		CorrectOptionID *int
	}
	rows, err := tx.Query(ctx, "SELECT id, correct_option_id FROM questions WHERE active_date = $1 AND correct_option_id IS NOT NULL", date)
	if err != nil {
		return err
	}

	for rows.Next() {
		var q struct {
			ID              int
			CorrectOptionID *int
		}
		if err := rows.Scan(&q.ID, &q.CorrectOptionID); err != nil {
			continue
		}
		questions = append(questions, q)
	}
	rows.Close()

	if len(questions) == 0 {
		return fmt.Errorf("no valid questions found to calculate for the date")
	}

	// 2. Count actual how many people answered ALL questions correctly.
	numQuestions := len(questions)
	var actualCorrectCount int
	countQuery := `
		SELECT COUNT(*) FROM (
			SELECT a.user_id 
			FROM answers a
			JOIN questions q ON a.question_id = q.id
			WHERE q.active_date = $1 AND a.chosen_option_id = q.correct_option_id
			GROUP BY a.user_id
			HAVING COUNT(a.id) = $2
		) sub
	`
	if err := tx.QueryRow(ctx, countQuery, date, numQuestions).Scan(&actualCorrectCount); err != nil {
		log.Printf("Failed to count actual all-correct users: %v", err)
		return err
	}

	// Make a map of correct answers for easy lookup
	correctMap := make(map[int]int)
	for _, q := range questions {
		correctMap[q.ID] = *q.CorrectOptionID
	}

	// 3. Process each answer for the questions today
	ansRows, err := tx.Query(ctx, `
		SELECT a.id, a.user_id, a.question_id, a.chosen_option_id, a.predicted_correct_count 
		FROM answers a
		JOIN questions q ON a.question_id = q.id
		WHERE q.active_date = $1
	`, date)
	if err != nil {
		return err
	}

	type UserScoreUpdate struct {
		AnswerID int
		UserID   int
		Score    int
	}
	var updates []UserScoreUpdate

	for ansRows.Next() {
		var ans struct {
			ID                    int
			UserID                int
			QuestionID            int
			ChosenOptionID        int
			PredictedCorrectCount int
		}
		if err := ansRows.Scan(&ans.ID, &ans.UserID, &ans.QuestionID, &ans.ChosenOptionID, &ans.PredictedCorrectCount); err != nil {
			continue
		}

		score := 0
		if correctOpt, ok := correctMap[ans.QuestionID]; ok && ans.ChosenOptionID == correctOpt {
			// They got this question right. Apply accuracy multiplier.
			maxVal := float64(actualCorrectCount)
			if float64(ans.PredictedCorrectCount) > maxVal {
				maxVal = float64(ans.PredictedCorrectCount)
			}

			if maxVal == 0 {
				score = 100 // Edge case
			} else {
				diff := math.Abs(float64(ans.PredictedCorrectCount) - float64(actualCorrectCount))
				accuracy := 1.0 - (diff / maxVal)
				if accuracy < 0 {
					accuracy = 0
				}
				score = int(math.Round(100.0 * accuracy))
			}
		}

		updates = append(updates, UserScoreUpdate{
			AnswerID: ans.ID,
			UserID:   ans.UserID,
			Score:    score,
		})
	}
	ansRows.Close()

	// Delete existing daily leaderboards for this date before upserting new ones
	_, _ = tx.Exec(ctx, "DELETE FROM leaderboards WHERE date = $1", date)

	// 4. Update the scores in the database
	for _, u := range updates {
		_, _ = tx.Exec(ctx, "UPDATE answers SET score = $1 WHERE id = $2", u.Score, u.AnswerID)

		// Upsert to user's daily leaderboard using a simplistic aggregator
		_, _ = tx.Exec(ctx,
			`INSERT INTO leaderboards (user_id, date, daily_score) 
			 VALUES ($1, $2, $3) 
			 ON CONFLICT (user_id, date) 
			 DO UPDATE SET daily_score = leaderboards.daily_score + EXCLUDED.daily_score`,
			u.UserID, date, u.Score,
		)
	}

	return tx.Commit(ctx)
}
