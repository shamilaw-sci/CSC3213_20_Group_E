package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestRateLimiter_Allow(t *testing.T) {
	// Rate limiter with capacity 3 and refill 1 per sec
	limiter := NewIPRateLimiter(1.0, 3.0)
	ip := "192.168.1.100"

	// First 3 requests should be allowed (burst)
	for i := 1; i <= 3; i++ {
		if !limiter.Allow(ip) {
			t.Errorf("Expected request %d to be allowed", i)
		}
	}

	// 4th request immediately should be rejected
	if limiter.Allow(ip) {
		t.Errorf("Expected 4th immediate request to be rejected")
	}

	// After sleeping > 1 second, a token refills
	time.Sleep(1100 * time.Millisecond)
	if !limiter.Allow(ip) {
		t.Errorf("Expected request after refill to be allowed")
	}
}

func TestRateLimitMiddleware_HTTPResponse(t *testing.T) {
	gin.SetMode(gin.TestMode)

	limiter := NewIPRateLimiter(0.5, 2.0) // 2 tokens
	r := gin.New()
	r.Use(RateLimitMiddleware(limiter))
	r.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	// Request 1: OK
	req1, _ := http.NewRequest(http.MethodGet, "/test", nil)
	req1.RemoteAddr = "10.0.0.1:1234"
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)
	if w1.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d", w1.Code)
	}

	// Request 2: OK
	req2, _ := http.NewRequest(http.MethodGet, "/test", nil)
	req2.RemoteAddr = "10.0.0.1:1234"
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d", w2.Code)
	}

	// Request 3: Exceeded -> 429
	req3, _ := http.NewRequest(http.MethodGet, "/test", nil)
	req3.RemoteAddr = "10.0.0.1:1234"
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)
	if w3.Code != http.StatusTooManyRequests {
		t.Fatalf("Expected 429 Too Many Requests, got %d", w3.Code)
	}
}
