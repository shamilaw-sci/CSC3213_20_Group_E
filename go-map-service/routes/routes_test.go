package routes

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"go-map-service/handlers"
	"go-map-service/logger"
	"go-map-service/models"
)

type MockRepo struct{}

func (m *MockRepo) SearchProperties(ctx context.Context, req models.SearchRequest) ([]models.PropertyResponse, error) {
	return []models.PropertyResponse{}, nil
}

func TestCORS_Whitelist(t *testing.T) {
	logger.InitLogger()
	os.Setenv("ALLOWED_ORIGIN", "https://thirasaraproperty.com,https://app.example.com")
	defer os.Unsetenv("ALLOWED_ORIGIN")

	handler := handlers.NewMapHandler(&MockRepo{})
	router := SetupRouter(handler)

	// Case 1: Allowed Origin (localhost:5173 default)
	req1, _ := http.NewRequest(http.MethodOptions, "/api/map/search", nil)
	req1.Header.Set("Origin", "http://localhost:5173")
	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)

	if w1.Code != http.StatusNoContent {
		t.Errorf("Expected 204 for allowed origin preflight, got %d", w1.Code)
	}
	if w1.Header().Get("Access-Control-Allow-Origin") != "http://localhost:5173" {
		t.Errorf("Expected Allow-Origin to be http://localhost:5173, got %s", w1.Header().Get("Access-Control-Allow-Origin"))
	}

	// Case 2: Allowed Custom Origin from ENV
	req2, _ := http.NewRequest(http.MethodOptions, "/api/map/search", nil)
	req2.Header.Set("Origin", "https://thirasaraproperty.com")
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)

	if w2.Code != http.StatusNoContent {
		t.Errorf("Expected 204 for custom allowed origin preflight, got %d", w2.Code)
	}
	if w2.Header().Get("Access-Control-Allow-Origin") != "https://thirasaraproperty.com" {
		t.Errorf("Expected Allow-Origin to be https://thirasaraproperty.com, got %s", w2.Header().Get("Access-Control-Allow-Origin"))
	}

	// Case 3: Malicious / Unallowed Origin
	req3, _ := http.NewRequest(http.MethodOptions, "/api/map/search", nil)
	req3.Header.Set("Origin", "https://evil-attacker.com")
	w3 := httptest.NewRecorder()
	router.ServeHTTP(w3, req3)

	if w3.Code != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden for disallowed origin preflight, got %d", w3.Code)
	}
	if w3.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Errorf("Expected NO Access-Control-Allow-Origin header for malicious origin, got %s", w3.Header().Get("Access-Control-Allow-Origin"))
	}
}
