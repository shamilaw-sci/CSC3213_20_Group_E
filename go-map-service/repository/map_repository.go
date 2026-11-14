package repository

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
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
	// Submission metadata must not fragment or bypass the search-result cache.
	req.SearchEventID = ""
	req.SearchDistrict = ""
	raw, _ := json.Marshal(req)
	hash := sha256.Sum256(raw)
	return hex.EncodeToString(hash[:])
}

func (r *MapRepository) SearchProperties(ctx context.Context, req models.SearchRequest) ([]models.PropertyResponse, error) {
	cacheKey := r.getCacheKey(req)

	// 1. Fast Cache Read (< 1ms from RAM)
	r.mu.RLock()
	if entry, found := r.cache[cacheKey]; found && time.Now().Before(entry.expiresAt) {
		r.mu.RUnlock()
		return r.activeCachedProperties(ctx, entry.data)
	}
	r.mu.RUnlock()

	query, args := buildSearchQuery(req)

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
		var virtualTours interface{}

		err := rows.Scan(&id, &title, &description, &price, &lat, &lng, &images, &beds, &baths, &landSize, &propType, &city, &listingType, &virtualTours)
		if err != nil {
			zap.L().Warn("Error scanning row", zap.Error(err))
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
			ID:           id,
			Title:        safeTitle,
			Description:  description,
			Price:        safePrice,
			Latitude:     lat,
			Longitude:    lng,
			Images:       safeImages,
			Bedrooms:     beds,
			Bathrooms:    baths,
			LandSize:     landSize,
			Type:         propType,
			City:         city,
			ListingType:  listingType,
			Address:      city,
			VirtualTours: virtualTours,
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

// Inventory visibility can change during the cache TTL.
func (r *MapRepository) activeCachedProperties(ctx context.Context, cached []models.PropertyResponse) ([]models.PropertyResponse, error) {
	if len(cached) == 0 {
		return cached, nil
	}
	ids := make([]string, len(cached))
	for i, property := range cached {
		ids[i] = property.ID
	}
	rows, err := r.Pool.Query(ctx, "SELECT id FROM properties WHERE id = ANY($1::uuid[]) AND status = 'approved' AND deleted_at IS NULL", ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	active := make(map[string]bool)
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		active[id] = true
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	result := make([]models.PropertyResponse, 0, len(cached))
	for _, property := range cached {
		if active[property.ID] {
			result = append(result, property)
		}
	}
	return result, nil
}
