package handlers

import (
	"context"
	"net/http"

	"go-map-service/models"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// MapRepositoryInterface allows us to mock the database in unit tests
type MapRepositoryInterface interface {
	SearchProperties(ctx context.Context, req models.SearchRequest) ([]models.PropertyResponse, error)
}

type MapHandler struct {
	Repo MapRepositoryInterface
}

func NewMapHandler(repo MapRepositoryInterface) *MapHandler {
	return &MapHandler{Repo: repo}
}

func (h *MapHandler) SearchMap(c *gin.Context) {
	var req models.SearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		zap.L().Warn("Invalid request format", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid search parameters. Please check your filter values."})
		return
	}

	// Validate WKT Polygon syntax, bounds, and vertex limits (M1 fix)
	if req.MinPrice != nil && req.MaxPrice != nil && *req.MinPrice > *req.MaxPrice {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Minimum price cannot exceed maximum price."})
		return
	}
	if err := models.ValidatePolygon(req.Polygon); err != nil {
		zap.L().Warn("Invalid polygon format", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid polygon geometry: " + err.Error()})
		return
	}

	zap.L().Info("Executing spatial map search")

	properties, err := h.Repo.SearchProperties(c.Request.Context(), req)
	if err != nil {
		zap.L().Error("Database spatial query failed", zap.Error(err))
		// Do NOT leak raw PostgreSQL schema/column error traces to clients (M2 fix)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to complete map search. Please try again later."})
		return
	}

	zap.L().Info("Found Properties", zap.Int("count", len(properties)))
	h.recordDemand(c, req.SearchEventID, req.SearchDistrict)
	c.JSON(http.StatusOK, gin.H{"properties": properties})
}
