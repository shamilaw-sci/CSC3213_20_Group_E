package routes

import (
	"os"

	"go-map-service/handlers"

	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
)

func SetupRouter(mapHandler *handlers.MapHandler) *gin.Engine {
	r := gin.Default()

	// Add Gzip compression
	r.Use(gzip.Gzip(gzip.DefaultCompression))

	// CORS Setup
	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "*" // Default fallback
	}

	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin == "" {
			origin = allowedOrigin
		}
		if origin == "*" {
			origin = "http://localhost:5173" // Wildcard not allowed with credentials
		}

		c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Register routes
	r.POST("/api/map/search", mapHandler.SearchMap)

	return r
}
