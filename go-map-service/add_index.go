package main

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	dbUrl := "postgresql://postgres.gezlojwtupnxmmfxeluy:CSC3213_2026@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

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
