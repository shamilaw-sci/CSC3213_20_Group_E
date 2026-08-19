package repository

import (
	"context"
	"fmt"
	"strings"

	"go-map-service/models"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

type MapRepository struct {
	Pool *pgxpool.Pool
}

func NewMapRepository(pool *pgxpool.Pool) *MapRepository {
	return &MapRepository{Pool: pool}
}

func (r *MapRepository) SearchProperties(ctx context.Context, req models.SearchRequest) ([]models.PropertyResponse, error) {
	// Query only essential public property columns without leaking seller PII (M3 fix)
	query := `SELECT p.id, p.title, p.description, p.price, p.latitude, p.longitude, p.images, p.bedrooms, p.bathrooms, p.land_size, p.type, p.city, p.listing_type
			  FROM properties p
			  WHERE p.status = 'approved'
			  AND ST_Intersects(p.boundary::geometry, ST_GeomFromText($1, 4326))`
	
	args := []interface{}{req.Polygon}
	paramCount := 1

	if req.Beds != nil {
		paramCount++
		query += fmt.Sprintf(" AND p.bedrooms >= $%d", paramCount)
		args = append(args, *req.Beds)
	}
	if req.Baths != nil {
		paramCount++
		query += fmt.Sprintf(" AND p.bathrooms >= $%d", paramCount)
		args = append(args, *req.Baths)
	}
	if req.Type != nil && *req.Type != "" {
		paramCount++
		// Escape SQL LIKE wildcard characters (_, %) to prevent unexpected wildcard matching (L3 fix)
		escapedType := strings.ReplaceAll(*req.Type, "%", "\\%")
		escapedType = strings.ReplaceAll(escapedType, "_", "\\_")
		query += fmt.Sprintf(" AND p.type ILIKE $%d", paramCount)
		args = append(args, fmt.Sprintf("%%%s%%", escapedType))
	}
	if req.ListingType != nil && *req.ListingType != "" {
		paramCount++
		query += fmt.Sprintf(" AND p.listing_type = $%d", paramCount)
		args = append(args, *req.ListingType)
	}

	// Limit results to 100 properties per spatial request to prevent bulk scraping (M3 fix)
	query += " LIMIT 100"

	rows, err := r.Pool.Query(ctx, query, args...)
	if err != nil {
		zap.L().Error("DB Query Error", zap.Error(err))
		return nil, err
	}
	defer rows.Close()

	var properties []models.PropertyResponse
	for rows.Next() {
		var id string
		var title, description, propType, city, listingType *string
		var price, lat, lng, landSize *float64
		var beds, baths *int
		var images *[]string

		err := rows.Scan(&id, &title, &description, &price, &lat, &lng, &images, &beds, &baths, &landSize, &propType, &city, &listingType)
		if err != nil {
			zap.L().Warn("Row Scan Error (Skipping property)", zap.Error(err))
			continue
		}

		safeTitle := "Untitled Property"
		if title != nil {
			safeTitle = *title
		}

		safePrice := float64(0)
		if price != nil {
			safePrice = *price
		}

		safeImages := []string{}
		if images != nil {
			safeImages = *images
		}

		propData := models.PropertyResponse{
			ID:          id,
			Title:       safeTitle,
			Description: description,
			Price:       safePrice,
			Latitude:    lat,
			Longitude:   lng,
			Images:      safeImages,
			Bedrooms:    beds,
			Bathrooms:   baths,
			LandSize:    landSize,
			Type:        propType,
			City:        city,
			ListingType: listingType,
			Address:     city,
		}

		properties = append(properties, propData)
	}

	if properties == nil {
		properties = []models.PropertyResponse{}
	}

	return properties, nil
}
