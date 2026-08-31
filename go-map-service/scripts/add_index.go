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

	fmt.Println("--- Creating GiST Index on properties.boundary ---")
	
	// Create index if it does not exist
	indexQuery := `CREATE INDEX IF NOT EXISTS idx_properties_boundary ON properties USING GIST (boundary);`
	
	_, err = pool.Exec(context.Background(), indexQuery)
	if err != nil {
		log.Fatal("Failed to create index:", err)
	}

	fmt.Println("✅ Successfully created GiST index!")
}
