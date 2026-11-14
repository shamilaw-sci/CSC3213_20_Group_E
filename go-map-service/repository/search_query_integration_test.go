package repository

import (
	"context"
	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
	"go-map-service/models"
	"os"
	"testing"
	"time"
)

// Explicit opt-in: only SELECT and EXPLAIN, enforced by a read-only transaction.
func TestPostGISSearchReadOnly(t *testing.T) {
	if os.Getenv("MAP_VERIFY_DATABASE") != "1" {
		t.Skip("set MAP_VERIFY_DATABASE=1 for read-only PostGIS verification")
	}
	_ = godotenv.Load("../.env")
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	conn, err := pgx.Connect(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		t.Fatal("Unable to connect for read-only PostGIS verification")
	}
	defer conn.Close(ctx)
	tx, err := conn.BeginTx(ctx, pgx.TxOptions{AccessMode: pgx.ReadOnly})
	if err != nil {
		t.Fatal("Unable to start read-only transaction")
	}
	defer tx.Rollback(ctx)
	var envelope, actual bool
	err = tx.QueryRow(ctx, `WITH shapes AS (
        SELECT ST_GeomFromText('POLYGON((0 0,2 0,0 2,0 0))',4326) a,
        ST_GeomFromText('POLYGON((1.5 1.5,2 1.5,2 2,1.5 2,1.5 1.5))',4326) b
    ) SELECT a && b, ST_Intersects(a,b) FROM shapes`).Scan(&envelope, &actual)
	if err != nil {
		t.Fatal(err)
	}
	if !envelope || actual {
		t.Fatal("Counterexample must have overlapping envelopes but disjoint geometries")
	}
	min, max, beds := 100.0, 10000000.0, 0
	listing := "Sale"
	query, args := buildSearchQuery(models.SearchRequest{
		Polygon: "POLYGON((79 5,82 5,82 10,79 10,79 5))", ListingType: &listing,
		SearchTerm: "Kandy", MinPrice: &min, MaxPrice: &max, Beds: &beds,
		ExactMatch: true, Has360Tour: true, Types: []string{"House", "Villa"},
	})
	var plan []byte
	if err := tx.QueryRow(ctx, "EXPLAIN (FORMAT JSON) "+query, args...).Scan(&plan); err != nil {
		t.Fatal(err)
	}
}
