package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go-map-service/handlers"
	"go-map-service/logger"
	"go-map-service/repository"
	"go-map-service/routes"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {
	// Initialize structured logger
	logger.InitLogger()
	defer logger.Sync()

	err := godotenv.Load()
	if err != nil {
		zap.L().Warn("No .env file found. Proceeding with environment variables.")
	}

	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		zap.L().Fatal("DATABASE_URL is not set!")
	}

	config, err := pgxpool.ParseConfig(dbUrl)
	if err != nil {
		zap.L().Fatal("Invalid database configuration URL")
	}
	config.MaxConns = 25
	config.MinConns = 5
	config.MaxConnLifetime = 30 * time.Minute
	config.MaxConnIdleTime = 5 * time.Minute

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		zap.L().Fatal("Unable to establish Supabase database connection pool")
	}
	defer pool.Close()
	zap.L().Info("Successfully connected to Supabase Database with connection pooling!")

	// Initialize dependencies
	repo := repository.NewMapRepository(pool)
	mapHandler := handlers.NewMapHandler(repo)

	// Setup router with database pool for readiness probes
	r := routes.SetupRouter(mapHandler, pool)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           r,
		ReadHeaderTimeout: 2 * time.Second,  // Defends against Slowloris attack
		ReadTimeout:       5 * time.Second,  // Maximum time to read entire request
		WriteTimeout:      10 * time.Second, // Maximum time to write response
		IdleTimeout:       60 * time.Second, // Maximum keep-alive idle connection time
		MaxHeaderBytes:    1 << 20,          // 1 MB max header size
	}

	go func() {
		zap.L().Info("Go Microservice running", zap.String("port", port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			zap.L().Fatal("Listen failed", zap.Error(err))
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	zap.L().Info("Shutting down server...")

	ctxShutdown, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctxShutdown); err != nil {
		zap.L().Fatal("Server forced to shutdown", zap.Error(err))
	}

	zap.L().Info("Server exiting gracefully")
}
