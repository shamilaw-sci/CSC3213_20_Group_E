/**
 * @file Main.go
 * @description Go microservice handling spatial map searches using PostGIS and Supabase.
 */

package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

// SearchRequest represents the incoming JSON payload for a map search.
// It expects a WKT (Well-Known Text) Polygon string.
type SearchRequest struct {
	Polygon string  `json:"polygon" binding:"required"`
	Beds        *int    `json:"beds"`
	Baths       *int    `json:"baths"`
	Type        *string `json:"type"`
	ListingType *string `json:"listing_type"`
}

// main initializes the environment, connects to the database,
// configures the Gin router, and starts the HTTP server.
func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: No .env file found.")
	}

	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		log.Fatal("❌ DATABASE_URL is not set!")
	}

	pool, err := pgxpool.New(context.Background(), dbUrl)
	if err != nil {
		log.Fatal("❌ Unable to connect to Supabase database:", err)
	}
	defer pool.Close()
	fmt.Println("✅ Successfully connected to Supabase Database!")

	r := gin.Default()

	// CORS Setup
	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "*" // Default fallback, should be restricted in production
	}

	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin == "" {
			origin = allowedOrigin
		}
		if origin == "*" {
			origin = "http://localhost:5173" // Wildcard not allowed with credentials
		}
		
		c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.POST("/api/map/search", func(c *gin.Context) {
		var req SearchRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request format"})
			return
		}

		log.Println("🔍 Searching in Polygon:", req.Polygon)

		query := `SELECT p.id, p.title, p.description, p.price, p.latitude, p.longitude, p.images, p.bedrooms, p.bathrooms, p.land_size, p.type, p.city, p.listing_type 
				  FROM search_properties($1) sp
				  JOIN properties p ON sp.id = p.id
				  WHERE p.status = 'approved'`
		
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
			query += fmt.Sprintf(" AND p.type = $%d", paramCount)
			args = append(args, *req.Type)
		}
		if req.ListingType != nil && *req.ListingType != "" {
			paramCount++
			query += fmt.Sprintf(" AND p.listing_type = $%d", paramCount)
			args = append(args, *req.ListingType)
		}

		rows, err := pool.Query(context.Background(), query, args...)
		if err != nil {
			log.Println("❌ DB Query Error:", err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Database query failed", "error": err.Error()})
			return
		}
		defer rows.Close()

		var properties []map[string]interface{}
		for rows.Next() {
			var id string
			var title, description, propType, city, listingType *string
			var price, lat, lng, landSize *float64
			var beds, baths *int
			var images *[]string

			err := rows.Scan(&id, &title, &description, &price, &lat, &lng, &images, &beds, &baths, &landSize, &propType, &city, &listingType)
			if err != nil {
				log.Println("⚠️ Row Scan Error (Skipping property):", err.Error())
				continue
			}

			safeTitle := "Untitled Property"
			if title != nil { safeTitle = *title }

			safePrice := float64(0)
			if price != nil { safePrice = *price }

			safeImages := []string{}
			if images != nil { safeImages = *images }

			propData := gin.H{
				"id":           id,
				"title":        safeTitle,
				"description":  description,
				"price":        safePrice,
				"latitude":     lat,
				"longitude":    lng,
				"images":       safeImages,
				"bedrooms":     beds,
				"bathrooms":    baths,
				"land_size":    landSize,
				"type":         propType,
				"listing_type": listingType,
				"address":      city, // Mapping city to address for the frontend
			}

			properties = append(properties, propData)
		}

		log.Println("✅ Found Properties:", len(properties))
		c.JSON(http.StatusOK, gin.H{"properties": properties})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	go func() {
		log.Println("🚀 Go Microservice running on port", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ Listen failed: %s\n", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("⚠️ Shutting down server...")

	ctxShutdown, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctxShutdown); err != nil {
		log.Fatal("❌ Server forced to shutdown:", err)
	}

	log.Println("✅ Server exiting gracefully")
}
