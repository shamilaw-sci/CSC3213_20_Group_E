package repository

import (
	"go-map-service/models"
	"strings"
	"testing"
)

func TestSearchQueryRequiresActualBoundaryIntersection(t *testing.T) {
	query, _ := buildSearchQuery(models.SearchRequest{Polygon: "POLYGON((0 0,1 0,1 1,0 0))"})
	if strings.Contains(query, "4326) OR ST_Intersects(p.boundary") {
		t.Fatal("overlapping bounding boxes must not bypass the geometry intersection")
	}
	if !strings.Contains(query, "4326) AND ST_Intersects(p.boundary") {
		t.Fatal("missing boundary intersection guard")
	}
}

func TestSearchQueryAppliesBoundFiltersBeforeLimit(t *testing.T) {
	min, max := 100.0, 500.0
	beds := 3
	query, args := buildSearchQuery(models.SearchRequest{
		Polygon: "polygon", SearchTerm: "Kandy_%", MinPrice: &min, MaxPrice: &max,
		Beds: &beds, ExactMatch: true, Has360Tour: true, Types: []string{"House", "Villa"},
	})
	for _, filter := range []string{"p.price >=", "p.price <=", "p.bedrooms =", "ILIKE ANY", "p.title ILIKE", "jsonb_array_length"} {
		if index := strings.Index(query, filter); index < 0 || index > strings.Index(query, "LIMIT 100") {
			t.Fatalf("filter missing before limit: %s", filter)
		}
	}
	if strings.Contains(query, "Kandy_%") {
		t.Fatal("search text must use a bound parameter")
	}
	found := false
	for _, arg := range args {
		if value, ok := arg.(string); ok && value == `%Kandy\_\%%` {
			found = true
		}
	}
	if !found {
		t.Fatal("LIKE wildcard characters should be literal text")
	}
}

func TestCacheKeyIncludesOptionalFilters(t *testing.T) {
	repo := &MapRepository{}
	a := models.SearchRequest{Polygon: "polygon"}
	b := a
	b.Has360Tour = true
	if repo.getCacheKey(a) == repo.getCacheKey(b) {
		t.Fatal("different filters must not share cached results")
	}
}
