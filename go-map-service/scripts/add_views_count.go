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

	fmt.Println("--- Altering properties table ---")
	
	// Add views_count column if it does not exist
	alterQuery := `ALTER TABLE properties ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;`
	
	_, err = pool.Exec(context.Background(), alterQuery)
	if err != nil {
		log.Fatal("Failed to alter table:", err)
	}

	fmt.Println("✅ Successfully added views_count column!")
}
