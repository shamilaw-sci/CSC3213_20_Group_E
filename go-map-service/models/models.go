package models

// SearchRequest represents the incoming JSON payload for a map search.
// It expects a WKT (Well-Known Text) Polygon string.
type SearchRequest struct {
	Polygon     string  `json:"polygon" binding:"required"`
	Beds        *int    `json:"beds" binding:"omitempty,min=0,max=50"`
	Baths       *int    `json:"baths" binding:"omitempty,min=0,max=50"`
	Type        *string `json:"type" binding:"omitempty,max=50"`
	ListingType *string `json:"listing_type" binding:"omitempty,oneof=sale rent Sale Rent"`
}

// PropertyResponse represents a single property returned from the map search.
type PropertyResponse struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description *string   `json:"description"`
	Price       float64   `json:"price"`
	Latitude    *float64  `json:"latitude"`
	Longitude   *float64  `json:"longitude"`
	Images      []string  `json:"images"`
	Bedrooms    *int      `json:"bedrooms"`
	Bathrooms   *int      `json:"bathrooms"`
	LandSize    *float64  `json:"land_size"`
	Type        *string   `json:"type"`
	City        *string   `json:"city"`
	ListingType *string   `json:"listing_type"`
	Address     *string   `json:"address"` // Mapping city to address
}
