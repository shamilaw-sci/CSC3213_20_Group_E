package routes

import (
	"os"
	"strings"

	"go-map-service/handlers"
	"go-map-service/middleware"

	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
)

func SetupRouter(mapHandler *handlers.MapHandler) *gin.Engine {
	r := gin.Default()

	// 1. Max Request Body Size (1 MB) to prevent OOM
	r.Use(middleware.MaxBodySizeMiddleware(1 << 20))

	// 2. Gzip compression for faster response delivery
	r.Use(gzip.Gzip(gzip.DefaultCompression))

	// 3. Token-Bucket Rate Limiter per IP (refill: 5 req/sec, burst: 30 requests)
	searchLimiter := middleware.NewIPRateLimiter(5.0, 30.0)

	// 4. CORS Setup - Strict Origin Whitelist
	allowedOriginsEnv := os.Getenv("ALLOWED_ORIGIN")
	allowedOrigins := map[string]bool{
		"http://localhost:5173": true, // Default Vite frontend
		"http://localhost:3000": true,
	}

	if allowedOriginsEnv != "" {
		for _, o := range strings.Split(allowedOriginsEnv, ",") {
			cleaned := strings.TrimSpace(o)
			if cleaned != "" {
				allowedOrigins[cleaned] = true
			}
		}
	}

	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		if origin != "" && allowedOrigins[origin] {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			c.Writer.Header().Set("Vary", "Origin")
		}

		if c.Request.Method == "OPTIONS" {
			if origin != "" && !allowedOrigins[origin] {
				c.AbortWithStatus(403)
				return
			}
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Register routes with Rate Limiting
	r.POST("/api/map/search", middleware.RateLimitMiddleware(searchLimiter), mapHandler.SearchMap)

	return r
}
