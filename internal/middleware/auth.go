package middleware

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"

	"nestkeeper/internal/db"
	"nestkeeper/internal/models"
)

// RequireAuth middleware checks for valid session
func RequireAuth(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		cookie, err := c.Cookie("session")
		if err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Authentication required"})
		}

		var session models.Session
		if err := db.DB.Preload("User").Where("id = ? AND expires_at > ?", cookie.Value, time.Now()).First(&session).Error; err != nil {
			// Clear invalid cookie
			c.SetCookie(&http.Cookie{
				Name:     "session",
				Value:    "",
				Path:     "/",
				MaxAge:   -1,
				HttpOnly: true,
			})
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Session expired"})
		}

		// Store user in context
		c.Set("user", &session.User)
		c.Set("session", &session)

		return next(c)
	}
}

// OptionalAuth middleware loads user if session exists but doesn't require it
func OptionalAuth(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		cookie, err := c.Cookie("session")
		if err != nil {
			return next(c)
		}

		var session models.Session
		if err := db.DB.Preload("User").Where("id = ? AND expires_at > ?", cookie.Value, time.Now()).First(&session).Error; err != nil {
			return next(c)
		}

		c.Set("user", &session.User)
		c.Set("session", &session)

		return next(c)
	}
}
