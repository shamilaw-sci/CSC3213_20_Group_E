package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type clientRecord struct {
	tokens   float64
	lastSeen time.Time
}

type IPRateLimiter struct {
	mu       sync.Mutex
	clients  map[string]*clientRecord
	rate     float64 // tokens per second
	capacity float64 // max burst capacity
}

// NewIPRateLimiter creates a thread-safe token-bucket rate limiter per IP.
// r: refill rate in requests per second (e.g., 2.0 = 2 req/sec or 120 req/min)
// burst: maximum burst capacity (e.g., 20)
func NewIPRateLimiter(r float64, burst float64) *IPRateLimiter {
	limiter := &IPRateLimiter{
		clients:  make(map[string]*clientRecord),
		rate:     r,
		capacity: burst,
	}

	// Periodic cleanup of inactive client entries every 3 minutes
	go limiter.cleanupLoop(3 * time.Minute)

	return limiter
}

func (l *IPRateLimiter) cleanupLoop(interval time.Duration) {
	ticker := time.NewTicker(interval)
	for range ticker.C {
		l.mu.Lock()
		now := time.Now()
		for ip, client := range l.clients {
			if now.Sub(client.lastSeen) > 5*time.Minute {
				delete(l.clients, ip)
			}
		}
		l.mu.Unlock()
	}
}

// Allow checks if the given IP has available tokens.
func (l *IPRateLimiter) Allow(ip string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	client, exists := l.clients[ip]
	if !exists {
		l.clients[ip] = &clientRecord{
			tokens:   l.capacity - 1.0,
			lastSeen: now,
		}
		return true
	}

	// Refill tokens based on elapsed time
	elapsed := now.Sub(client.lastSeen).Seconds()
	client.lastSeen = now
	client.tokens += elapsed * l.rate
	if client.tokens > l.capacity {
		client.tokens = l.capacity
	}

	if client.tokens >= 1.0 {
		client.tokens -= 1.0
		return true
	}

	return false
}

// RateLimitMiddleware returns a Gin HandlerFunc enforcing the rate limiter.
func RateLimitMiddleware(limiter *IPRateLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		if !limiter.Allow(ip) {
			c.Header("Retry-After", "5")
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"message": "Too many requests. Spatial search rate limit exceeded.",
			})
			return
		}
		c.Next()
	}
}

// MaxBodySizeMiddleware limits the maximum request body to prevent memory exhaustion (e.g. 1MB).
func MaxBodySizeMiddleware(maxBytes int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBytes)
		c.Next()
	}
}
