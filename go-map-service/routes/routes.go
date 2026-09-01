package routes

import (
	"context"
	"os"
	"strings"
	"time"

	"go-map-service/handlers"
	"go-map-service/middleware"

	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func SetupRouter(mapHandler *handlers.MapHandler, pool ...*pgxpool.Pool) *gin.Engine {
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
		for _, origin := range strings.Split(allowedOriginsEnv, ",") {
			trimmed := strings.TrimSpace(origin)
			if trimmed != "" {
				allowedOrigins[trimmed] = true
			}
		}
	}

	isAllowedOrigin := func(origin string) bool {
		if origin == "" {
			return true
		}
		if allowedOrigins[origin] {
			return true
		}
		// Allow any localhost or 127.0.0.1 development port
		if strings.HasPrefix(origin, "http://localhost:") || strings.HasPrefix(origin, "http://127.0.0.1:") {
			return true
		}
		// Allow Vercel preview & production deployments
		if strings.HasSuffix(origin, ".vercel.app") || origin == "https://thirasara-property.vercel.app" {
			return true
		}
		return false
	}

	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		if isAllowedOrigin(origin) {
			if origin != "" {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			} else {
				c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
			}
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
			c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET")
			c.Writer.Header().Set("Vary", "Origin")
		}

		if c.Request.Method == "OPTIONS" {
			if !isAllowedOrigin(origin) {
				c.AbortWithStatus(403)
				return
			}
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// 5. Health check / Liveness Probe (Docker, Kubernetes, Uptime monitors)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "healthy",
			"service":   "go-map-service",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
	})

	// 6. Readiness Probe (Deep database connection ping)
	r.GET("/health/ready", func(c *gin.Context) {
		if len(pool) > 0 && pool[0] != nil {
			ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
			defer cancel()
			if err := pool[0].Ping(ctx); err != nil {
				c.JSON(503, gin.H{
					"status":   "unready",
					"service":  "go-map-service",
					"database": "disconnected",
					"error":    "Database ping failed",
				})
				return
			}
		}
		c.JSON(200, gin.H{
			"status":   "ready",
			"service":  "go-map-service",
			"database": "connected",
		})
	})

	// 7. Register routes with Rate Limiting
	r.POST("/api/map/search", middleware.RateLimitMiddleware(searchLimiter), mapHandler.SearchMap)

	return r
}
