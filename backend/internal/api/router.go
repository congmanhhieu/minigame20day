package api

import (
	"net/http"

	"backend/internal/api/handler"
	"backend/internal/api/middleware"
	"backend/internal/config"
	"backend/internal/service"
	"backend/pkg/response"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func SetupRouter(cfg *config.Config, db *pgxpool.Pool, rdb *redis.Client, scoreService *service.ScoreService) *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	r.GET("/health", func(c *gin.Context) {
		response.Success(c, http.StatusOK, "Server is healthy", gin.H{
			"version": "1.0.0",
		})
	})

	authHandler := handler.NewAuthHandler(cfg, db)
	adminHandler := handler.NewAdminHandler(db, rdb, scoreService)

	v1 := r.Group("/api/v1")
	{
		authGrp := v1.Group("/auth")
		{
			authGrp.GET("/login/:provider", authHandler.LoginOAuth)
			authGrp.GET("/:provider/callback", authHandler.OAuthCallback)
			authGrp.POST("/admin/login", authHandler.AdminLogin)
		}

		adminGrp := v1.Group("/admin")
		adminGrp.Use(middleware.RequireAdmin(cfg))
		{
			adminGrp.POST("/questions", adminHandler.CreateQuestion)
			adminGrp.GET("/questions", adminHandler.ListQuestions)
			adminGrp.PUT("/questions/:id", adminHandler.UpdateQuestion)
			adminGrp.DELETE("/questions/:id", adminHandler.DeleteQuestion)
			adminGrp.POST("/prizes", adminHandler.CreatePrize)
			adminGrp.GET("/prizes", adminHandler.ListPrizes)
			adminGrp.PUT("/prizes/:id", adminHandler.UpdatePrize)
			adminGrp.DELETE("/prizes/:id", adminHandler.DeletePrize)
		}

		gameHandler := handler.NewGameHandler(db, rdb)
		gameGrp := v1.Group("/game")
		gameGrp.Use(middleware.RequireAuth(cfg))
		{
			gameGrp.GET("/questions/today", gameHandler.GetTodayQuestions)
			gameGrp.GET("/prizes", gameHandler.GetPrizes)
			gameGrp.GET("/summary/yesterday", gameHandler.GetYesterdaySummary)
			gameGrp.POST("/answers", gameHandler.SubmitAnswer)
		}

		lbHandler := handler.NewLeaderboardHandler(db, rdb)
		lbGrp := v1.Group("/leaderboard")
		{
			lbGrp.GET("/daily", lbHandler.GetDailyLeaderboard)
			lbGrp.GET("/overall", lbHandler.GetOverallLeaderboard)
		}

		userHandler := handler.NewUserHandler(db)
		userGrp := v1.Group("/users")
		userGrp.Use(middleware.RequireAuth(cfg))
		{
			userGrp.GET("/me", userHandler.GetUserProfile)
		}
	}

	return r
}
