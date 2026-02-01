package handlers

import (
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"

	"nestkeeper/internal/db"
	"nestkeeper/internal/models"
)

type RegisterRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type AuthResponse struct {
	User    UserResponse `json:"user"`
	Message string       `json:"message"`
}

type UserResponse struct {
	ID               string `json:"id"`
	Username         string `json:"username"`
	Email            string `json:"email"`
	SubscriptionTier string `json:"subscriptionTier"`
	IsPro            bool   `json:"isPro"`
}

// Register creates a new user account
func Register(c echo.Context) error {
	var req RegisterRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	if req.Username == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Username and password are required"})
	}

	if len(req.Password) < 8 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Password must be at least 8 characters"})
	}

	// Check if user already exists
	var existingUser models.User
	if err := db.DB.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "Username already exists"})
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create user"})
	}

	user := models.User{
		ID:           uuid.New().String(),
		Username:     req.Username,
		PasswordHash: string(hashedPassword),
		Email:        req.Email,
	}

	if err := db.DB.Create(&user).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create user"})
	}

	// Create session
	session := createSession(user.ID)
	if err := db.DB.Create(&session).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create session"})
	}

	setSessionCookie(c, session.ID, session.ExpiresAt)

	return c.JSON(http.StatusCreated, AuthResponse{
		User: UserResponse{
			ID:               user.ID,
			Username:         user.Username,
			Email:            user.Email,
			SubscriptionTier: string(user.SubscriptionTier),
			IsPro:            user.IsPro(),
		},
		Message: "Registration successful",
	})
}

// Login authenticates a user
func Login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	if req.Username == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Username and password are required"})
	}

	// Find user
	var user models.User
	if err := db.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid credentials"})
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid credentials"})
	}

	// Create session
	session := createSession(user.ID)
	if err := db.DB.Create(&session).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create session"})
	}

	setSessionCookie(c, session.ID, session.ExpiresAt)

	return c.JSON(http.StatusOK, AuthResponse{
		User: UserResponse{
			ID:               user.ID,
			Username:         user.Username,
			Email:            user.Email,
			SubscriptionTier: string(user.SubscriptionTier),
			IsPro:            user.IsPro(),
		},
		Message: "Login successful",
	})
}

// Logout ends the user session
func Logout(c echo.Context) error {
	cookie, err := c.Cookie("session")
	if err == nil {
		// Delete session from database
		db.DB.Where("id = ?", cookie.Value).Delete(&models.Session{})
	}

	// Clear cookie
	c.SetCookie(&http.Cookie{
		Name:     "session",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})

	return c.JSON(http.StatusOK, map[string]string{"message": "Logged out successfully"})
}

// GetCurrentUser returns the authenticated user
func GetCurrentUser(c echo.Context) error {
	user := c.Get("user").(*models.User)
	return c.JSON(http.StatusOK, UserResponse{
		ID:               user.ID,
		Username:         user.Username,
		Email:            user.Email,
		SubscriptionTier: string(user.SubscriptionTier),
		IsPro:            user.IsPro(),
	})
}

// CheckSetup returns whether a user account exists
func CheckSetup(c echo.Context) error {
	var count int64
	db.DB.Model(&models.User{}).Count(&count)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"setupComplete": count > 0,
		"userCount":     count,
	})
}

func createSession(userID string) models.Session {
	return models.Session{
		ID:        uuid.New().String(),
		UserID:    userID,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour), // 7 days
	}
}

func setSessionCookie(c echo.Context, sessionID string, expiresAt time.Time) {
	c.SetCookie(&http.Cookie{
		Name:     "session",
		Value:    sessionID,
		Path:     "/",
		Expires:  expiresAt,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		// Secure: true, // Enable in production with HTTPS
	})
}
