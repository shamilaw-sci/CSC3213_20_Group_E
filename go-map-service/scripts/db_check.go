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

	fmt.Println("--- Checking Indexes on properties table ---")
	indexQuery := `
		SELECT indexname, indexdef
		FROM pg_indexes
		WHERE tablename = 'properties';
	`
	rows, err := pool.Query(context.Background(), indexQuery)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()
	for rows.Next() {
		var name, def string
		rows.Scan(&name, &def)
		fmt.Printf("Index: %s -> %s\n", name, def)
	}

	fmt.Println("\n--- Checking search_properties function definition ---")
	funcQuery := `
		SELECT pg_get_functiondef(p.oid)
		FROM pg_proc p
		JOIN pg_namespace n ON p.pronamespace = n.oid
		WHERE n.nspname = 'public' AND p.proname = 'search_properties';
	`
	funcRows, err := pool.Query(context.Background(), funcQuery)
	if err != nil {
		log.Fatal(err)
	}
	defer funcRows.Close()
	for funcRows.Next() {
		var def string
		funcRows.Scan(&def)
		fmt.Printf("Function Definition:\n%s\n", def)
	}
}
