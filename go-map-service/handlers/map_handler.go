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
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request format"})
		return
	}

	zap.L().Info("Searching in Polygon", zap.String("polygon", req.Polygon))

	properties, err := h.Repo.SearchProperties(c.Request.Context(), req)
	if err != nil {
		zap.L().Error("Database query failed", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Database query failed", "error": err.Error()})
		return
	}

	zap.L().Info("Found Properties", zap.Int("count", len(properties)))
	c.JSON(http.StatusOK, gin.H{"properties": properties})
}
