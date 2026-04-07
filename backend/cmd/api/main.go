package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"backend/internal/api"
	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/service"

	"github.com/robfig/cron/v3"
)

func main() {
	// 1. Load config
	cfg := config.LoadConfig()

	// 2. Setup DB Connections
	// Commenting out fatal errors if PG/Redis are down to allow server to boot config correctly
	dbPool := database.ConnectPostgres(cfg.DBUrl)
	defer dbPool.Close()

	redisClient := database.ConnectRedis(cfg.RedisUrl)
	defer redisClient.Close()

	// 3. Setup Services
	scoreService := service.NewScoreService(dbPool)

	// 4. Setup Gin Router
	r := api.SetupRouter(cfg, dbPool, redisClient, scoreService)

	// 4.5 Setup Cron Job for daily score calculation at 00:00 (server time)
	c := cron.New()
	_, err := c.AddFunc("00 00 * * *", func() {
		today := time.Now().Format("2006-01-02")
		log.Printf("CRON: Starting daily score calculation for date: %s", today)
		if err := scoreService.CalculateDailyScores(context.Background(), today); err != nil {
			log.Printf("CRON: Score calculation failed: %v", err)
		} else {
			// Invalidate caches
			redisClient.Del(context.Background(), fmt.Sprintf("leaderboard:daily:%s", today), "leaderboard:overall")
			log.Printf("CRON: Score calculation successfully completed and cache invalidated")
		}
	})
	if err != nil {
		log.Fatalf("Failed to initialize cron job: %v", err)
	}
	c.Start()

	// 5. Run Server
	log.Printf("Starting server on port %s...", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
