package repository

import (
	"fmt"
	"go-map-service/models"
	"strings"
)

func literalLike(value string) string {
	return strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(value)
}

// Keep all optional filtering in SQL so the result cap cannot discard matches.
func buildSearchQuery(req models.SearchRequest) (string, []interface{}) {
	query := `SELECT p.id, p.title, p.description, p.price, p.latitude, p.longitude, p.images, p.bedrooms, p.bathrooms, p.land_size, p.type, p.city, p.listing_type, p.virtual_tours
        FROM properties p WHERE p.status = 'approved' AND p.deleted_at IS NULL AND (
            (p.boundary IS NOT NULL AND (p.boundary::geometry && ST_GeomFromText($1, 4326) AND ST_Intersects(p.boundary::geometry, ST_GeomFromText($1, 4326))))
            OR (p.boundary IS NULL AND p.longitude IS NOT NULL AND p.latitude IS NOT NULL AND ST_Intersects(ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326), ST_GeomFromText($1, 4326)))
        )`
	args := []interface{}{req.Polygon}
	add := func(clause string, value interface{}) {
		args = append(args, value)
		query += fmt.Sprintf(clause, len(args))
	}
	comparison := ">="
	if req.ExactMatch {
		comparison = "="
	}
	if req.Beds != nil {
		add(" AND p.bedrooms "+comparison+" $%d", *req.Beds)
	}
	if req.Baths != nil {
		add(" AND p.bathrooms "+comparison+" $%d", *req.Baths)
	}
	if len(req.Types) > 0 {
		patterns := make([]string, len(req.Types))
		for i, value := range req.Types {
			patterns[i] = "%" + literalLike(value) + "%"
		}
		add(" AND p.type ILIKE ANY($%d)", patterns)
	} else if req.Type != nil && *req.Type != "" {
		add(" AND p.type ILIKE $%d", "%"+literalLike(*req.Type)+"%")
	}
	if req.ListingType != nil && *req.ListingType != "" {
		add(" AND lower(p.listing_type::text) = lower($%d)", *req.ListingType)
	}
	if req.MinPrice != nil {
		add(" AND p.price >= $%d", *req.MinPrice)
	}
	if req.MaxPrice != nil {
		add(" AND p.price <= $%d", *req.MaxPrice)
	}
	if req.SearchTerm != "" {
		args = append(args, "%"+literalLike(req.SearchTerm)+"%")
		query += fmt.Sprintf(" AND (p.title ILIKE $%d OR p.city ILIKE $%d)", len(args), len(args))
	}
	if req.Has360Tour {
		query += " AND CASE WHEN jsonb_typeof(p.virtual_tours) = 'array' THEN jsonb_array_length(p.virtual_tours) > 0 ELSE false END"
	}
	query += " ORDER BY p.id LIMIT 100"
	return query, args
}
