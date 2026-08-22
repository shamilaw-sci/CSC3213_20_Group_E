package repository

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
	"sync"
	"time"

	"go-map-service/models"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

type cacheEntry struct {
	data      []models.PropertyResponse
	expiresAt time.Time
}

type MapRepository struct {
	Pool  *pgxpool.Pool
	cache map[string]cacheEntry
	mu    sync.RWMutex
}

func NewMapRepository(pool *pgxpool.Pool) *MapRepository {
	repo := &MapRepository{
		Pool:  pool,
		cache: make(map[string]cacheEntry),
	}
	// Background cache cleanup every 1 minute
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		for range ticker.C {
			repo.mu.Lock()
			now := time.Now()
			for k, v := range repo.cache {
				if now.After(v.expiresAt) {
					delete(repo.cache, k)
				}
			}
			repo.mu.Unlock()
		}
	}()
	return repo
}

func (r *MapRepository) getCacheKey(req models.SearchRequest) string {
	raw := fmt.Sprintf("%s|%v|%v|%v|%v",
		req.Polygon,
		req.Beds,
		req.Baths,
		req.Type,
		req.ListingType,
	)
	hash := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(hash[:])
}

func (r *MapRepository) SearchProperties(ctx context.Context, req models.SearchRequest) ([]models.PropertyResponse, error) {
	cacheKey := r.getCacheKey(req)

	// 1. Fast Cache Read (< 1ms from RAM)
	r.mu.RLock()
	if entry, found := r.cache[cacheKey]; found && time.Now().Before(entry.expiresAt) {
		r.mu.RUnlock()
		return entry.data, nil
	}
	r.mu.RUnlock()

	// 2. High-Speed PostGIS Spatial Query (Points + Polygons with Index operators)
	query := `SELECT p.id, p.title, p.description, p.price, p.latitude, p.longitude, p.images, p.bedrooms, p.bathrooms, p.land_size, p.type, p.city, p.listing_type
			  FROM properties p
			  WHERE p.status = 'approved'
			  AND (
			      (p.boundary IS NOT NULL AND (p.boundary::geometry && ST_GeomFromText($1, 4326) OR ST_Intersects(p.boundary::geometry, ST_GeomFromText($1, 4326))))
			      OR
			      (p.boundary IS NULL AND p.longitude IS NOT NULL AND p.latitude IS NOT NULL AND ST_Intersects(ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326), ST_GeomFromText($1, 4326)))
			  )`
	
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

	// 3. Store in Hot Spatial Cache (30s TTL)
	r.mu.Lock()
	r.cache[cacheKey] = cacheEntry{
		data:      properties,
		expiresAt: time.Now().Add(30 * time.Second),
	}
	r.mu.Unlock()

	return properties, nil
}
