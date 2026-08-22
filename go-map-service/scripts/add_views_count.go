package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	pool, err := pgxpool.New(context.Background(), dbUrl)
	if err != nil {
		log.Fatal("Unable to connect to Supabase database:", err)
	}
	defer pool.Close()

	fmt.Println("--- Altering properties table ---")
	
	// Add views_count column if it does not exist
	alterQuery := `ALTER TABLE properties ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;`
	
	_, err = pool.Exec(context.Background(), alterQuery)
	if err != nil {
		log.Fatal("Failed to alter table:", err)
	}

	fmt.Println("✅ Successfully added views_count column!")
}
