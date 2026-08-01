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
