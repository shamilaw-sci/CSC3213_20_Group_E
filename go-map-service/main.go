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

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

// SearchRequest represents the incoming JSON payload for a map search.
// It expects a WKT (Well-Known Text) Polygon string.
type SearchRequest struct {
	Polygon string `json:"polygon" binding:"required"`
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
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
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

		// Execute the stored RPC function search_properties in Supabase
		query := `SELECT id, title, description, price, latitude, longitude, images 
				  FROM search_properties($1)`

		rows, err := pool.Query(context.Background(), query, req.Polygon)
		if err != nil {
			log.Println("❌ DB Query Error:", err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Database query failed", "error": err.Error()})
			return
		}
		defer rows.Close()

		var properties []map[string]interface{}
		for rows.Next() {
			var id string
			var title, description *string
			var price, lat, lng *float64

			// Use a pointer to a slice to safely handle potential NULL values from the database array
			var images *[]string

			err := rows.Scan(&id, &title, &description, &price, &lat, &lng, &images)
			if err != nil {
				log.Println("⚠️ Row Scan Error (Skipping property):", err.Error())
				continue
			}

			// Safely dereference pointers with fallback default values
			safeTitle := "Untitled Property"
			if title != nil {
				safeTitle = *title
			}

			safePrice := float64(0)
			if price != nil {
				safePrice = *price
			}

			// Ensure images is always an initialized array, avoiding null reference issues on the frontend
			safeImages := []string{}
			if images != nil {
				safeImages = *images
			}

			properties = append(properties, gin.H{
				"id":          id,
				"title":       safeTitle,
				"description": description,
				"price":       safePrice,
				"latitude":    lat,
				"longitude":   lng,
				"images":      safeImages,
			})
		}

		log.Println("✅ Found Properties:", len(properties))
		c.JSON(http.StatusOK, gin.H{"properties": properties})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("🚀 Go Microservice running on port", port)
	r.Run(":" + port)
}
