package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"go-map-service/logger"
	"go-map-service/models"

	"github.com/gin-gonic/gin"
)

// MockRepository implements MapRepositoryInterface for testing
type MockRepository struct {
	MockProperties []models.PropertyResponse
	MockError      error
}

func (m *MockRepository) SearchProperties(ctx context.Context, req models.SearchRequest) ([]models.PropertyResponse, error) {
	return m.MockProperties, m.MockError
}

func TestSearchMap_Success(t *testing.T) {
	// Initialize logger to prevent nil pointer in tests
	logger.InitLogger()
	defer logger.Sync()

	gin.SetMode(gin.TestMode)

	// Setup mock data
	mockRepo := &MockRepository{
		MockProperties: []models.PropertyResponse{
			{ID: "prop1", Title: "Test House", Price: 1000},
		},
		MockError: nil,
	}
	handler := NewMapHandler(mockRepo)

	router := gin.Default()
	router.POST("/api/map/search", handler.SearchMap)

	// Create valid request
	reqBody := `{"polygon": "POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))"}`
	req, _ := http.NewRequest(http.MethodPost, "/api/map/search", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status code %d, got %d", http.StatusOK, w.Code)
	}

	var response map[string][]models.PropertyResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if len(response["properties"]) != 1 {
		t.Errorf("Expected 1 property, got %d", len(response["properties"]))
	}
	if response["properties"][0].Title != "Test House" {
		t.Errorf("Expected title 'Test House', got '%s'", response["properties"][0].Title)
	}
}

func TestSearchMap_InvalidJSON(t *testing.T) {
	logger.InitLogger()
	defer logger.Sync()

	gin.SetMode(gin.TestMode)
	handler := NewMapHandler(&MockRepository{})
	router := gin.Default()
	router.POST("/api/map/search", handler.SearchMap)

	// Missing 'polygon' which is required
	reqBody := `{"beds": 2}`
	req, _ := http.NewRequest(http.MethodPost, "/api/map/search", bytes.NewBufferString(reqBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("Expected status code %d, got %d", http.StatusBadRequest, w.Code)
	}
}
