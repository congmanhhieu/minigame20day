package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                 string
	DBUrl                string
	RedisUrl             string
	JWTSecret            string
	GoogleClientID       string
	GoogleClientSecret   string
	GoogleRedirectURL    string
	FacebookClientID     string
	FacebookClientSecret string
	FacebookRedirectURL  string
	FrontendURL          string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, relying on system environment variables")
	}

	return &Config{
		Port:                 getEnv("PORT", "8080"),
		DBUrl:                getEnv("DB_URL", "postgres://localhost:5432/minigame20day?sslmode=disable"),
		RedisUrl:             getEnv("REDIS_URL", "redis://localhost:6379/0"),
		JWTSecret:            getEnv("JWT_SECRET", "secret"),
		GoogleClientID:       getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret:   getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:    getEnv("GOOGLE_REDIRECT_URL", ""),
		FacebookClientID:     getEnv("FACEBOOK_CLIENT_ID", ""),
		FacebookClientSecret: getEnv("FACEBOOK_CLIENT_SECRET", ""),
		FacebookRedirectURL:  getEnv("FACEBOOK_REDIRECT_URL", ""),
		FrontendURL:          getEnv("FRONTEND_URL", "http://localhost:3000"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
