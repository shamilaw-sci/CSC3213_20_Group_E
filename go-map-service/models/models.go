package models

// SearchRequest represents the incoming JSON payload for a map search.
// It expects a WKT (Well-Known Text) Polygon string.
type SearchRequest struct {
	Polygon     string  `json:"polygon" binding:"required"`
	Beds        *int    `json:"beds"`
	Baths       *int    `json:"baths"`
	Type        *string `json:"type"`
	ListingType *string `json:"listing_type"`
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
	SellerName  *string   `json:"seller_name"`
	SellerRole  *string   `json:"seller_role"`
	Address     *string   `json:"address"` // Mapping city to address
}
