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
	_ = godotenv.Load("../.env")
	_ = godotenv.Load(".env")

	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	pool, err := pgxpool.New(context.Background(), dbUrl)
	if err != nil {
		log.Fatal("Unable to connect to database:", err)
	}
	defer pool.Close()

	fmt.Println("--- Updating PostgreSQL user_role enum ---")
	
	_, err = pool.Exec(context.Background(), "ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'BANNED'")
	if err != nil {
		fmt.Println("Notice BANNED:", err)
	} else {
		fmt.Println("✅ Added 'BANNED' to user_role enum")
	}

	_, err = pool.Exec(context.Background(), "ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'REJECTED_AGENT'")
	if err != nil {
		fmt.Println("Notice REJECTED_AGENT:", err)
	} else {
		fmt.Println("✅ Added 'REJECTED_AGENT' to user_role enum")
	}

	fmt.Println("✅ Database enum migration complete!")
}
