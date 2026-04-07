package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"

	"backend/internal/config"
	"backend/pkg/auth"
	"backend/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AuthHandler struct {
	cfg *config.Config
	db  *pgxpool.Pool
}

func NewAuthHandler(cfg *config.Config, db *pgxpool.Pool) *AuthHandler {
	return &AuthHandler{cfg: cfg, db: db}
}

func (h *AuthHandler) LoginOAuth(c *gin.Context) {
	provider := c.Param("provider")

	var authURL string
	if provider == "google" {
		authURL = "https://accounts.google.com/o/oauth2/v2/auth?client_id=" + h.cfg.GoogleClientID +
			"&redirect_uri=" + h.cfg.GoogleRedirectURL +
			"&response_type=code&scope=openid%20profile%20email"
	} else if provider == "facebook" {
		authURL = "https://www.facebook.com/v12.0/dialog/oauth?client_id=" + h.cfg.FacebookClientID +
			"&redirect_uri=" + h.cfg.FacebookRedirectURL +
			"&scope=email"
	} else {
		response.Error(c, http.StatusBadRequest, "Unsupported provider")
		return
	}

	c.Redirect(http.StatusTemporaryRedirect, authURL)
}

func (h *AuthHandler) OAuthCallback(c *gin.Context) {
	provider := c.Param("provider")
	code := c.Query("code")
	if code == "" {
		response.Error(c, http.StatusBadRequest, "Missing code")
		return
	}

	var extID, name, email string

	if provider == "google" {
		// 1. Exchange code for access token
		data := url.Values{}
		data.Set("code", code)
		data.Set("client_id", h.cfg.GoogleClientID)
		data.Set("client_secret", h.cfg.GoogleClientSecret)
		data.Set("redirect_uri", h.cfg.GoogleRedirectURL)
		data.Set("grant_type", "authorization_code")

		resp, err := http.PostForm("https://oauth2.googleapis.com/token", data)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "Failed to connect to Google")
			return
		}
		defer resp.Body.Close()

		var tokenRes struct {
			AccessToken string `json:"access_token"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&tokenRes); err != nil || tokenRes.AccessToken == "" {
			response.Error(c, http.StatusBadRequest, "Failed to get access token")
			return
		}

		// 2. Fetch User Info
		req, _ := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v2/userinfo", nil)
		req.Header.Set("Authorization", "Bearer "+tokenRes.AccessToken)
		client := &http.Client{}
		userInfoResp, err := client.Do(req)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "Failed to fetch user info")
			return
		}
		defer userInfoResp.Body.Close()

		var userInfo struct {
			Id    string `json:"id"`
			Name  string `json:"name"`
			Email string `json:"email"`
		}
		if err := json.NewDecoder(userInfoResp.Body).Decode(&userInfo); err != nil {
			response.Error(c, http.StatusInternalServerError, "Failed to decode user info")
			return
		}

		extID = userInfo.Id
		name = userInfo.Name
		email = userInfo.Email
	} else if provider == "facebook" {
		// 1. Get access token
		tokenURL := fmt.Sprintf("https://graph.facebook.com/v12.0/oauth/access_token?client_id=%s&redirect_uri=%s&client_secret=%s&code=%s",
			h.cfg.FacebookClientID, h.cfg.FacebookRedirectURL, h.cfg.FacebookClientSecret, code)
		resp, err := http.Get(tokenURL)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "Failed to connect to Facebook")
			return
		}
		defer resp.Body.Close()

		var tokenRes struct {
			AccessToken string `json:"access_token"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&tokenRes); err != nil || tokenRes.AccessToken == "" {
			response.Error(c, http.StatusBadRequest, "Failed to get access token from Facebook")
			return
		}

		// 2. Fetch User Info
		infoURL := fmt.Sprintf("https://graph.facebook.com/me?fields=id,name,email&access_token=%s", tokenRes.AccessToken)
		userInfoResp, err := http.Get(infoURL)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "Failed to fetch Facebook user info")
			return
		}
		defer userInfoResp.Body.Close()

		var userInfo struct {
			Id    string `json:"id"`
			Name  string `json:"name"`
			Email string `json:"email"`
		}
		if err := json.NewDecoder(userInfoResp.Body).Decode(&userInfo); err != nil {
			response.Error(c, http.StatusInternalServerError, "Failed to decode Facebook user info")
			return
		}

		extID = userInfo.Id
		name = userInfo.Name
		email = userInfo.Email
	} else {
		response.Error(c, http.StatusBadRequest, "Unsupported provider")
		return
	}

	if extID == "" {
		response.Error(c, http.StatusBadRequest, "Failed to get User ID from provider")
		return
	}

	// Upsert User in DB
	var userID int
	err := h.db.QueryRow(context.Background(),
		`INSERT INTO users (external_id, provider, name, email, role) 
		 VALUES ($1, $2, $3, $4, 'user') 
		 ON CONFLICT (external_id, provider) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email
		 RETURNING id`,
		extID, provider, name, email,
	).Scan(&userID)

	if err != nil {
		log.Println("OAuth user sync error:", err)
		response.Error(c, http.StatusInternalServerError, "Failed to sync user")
		return
	}

	token, err := auth.GenerateToken(userID, "user", h.cfg.JWTSecret)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	// Redirect to frontend callback page with token
	frontendURL := fmt.Sprintf("http://localhost:3000/auth/callback?token=%s&name=%s&email=%s&id=%d",
		token, url.QueryEscape(name), url.QueryEscape(email), userID)
	c.Redirect(http.StatusTemporaryRedirect, frontendURL)
}

func (h *AuthHandler) AdminLogin(c *gin.Context) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Simple admin login - per user request for simplicity
	if req.Email == "admin@minigame.com" && req.Password == "admin123" {
		// Mock admin account ID
		token, err := auth.GenerateToken(999, "admin", h.cfg.JWTSecret)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "Failed to sign token")
			return
		}
		response.Success(c, http.StatusOK, "Admin logged in", gin.H{"token": token})
		return
	}

	response.Error(c, http.StatusUnauthorized, "Invalid credentials")
}
