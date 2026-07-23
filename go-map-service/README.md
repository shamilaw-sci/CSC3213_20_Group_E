# Go Map Service

A lightweight Go microservice (using Gin + PostGIS) that powers polygon-based
property search on the map. It receives a drawn search area from the frontend
map and returns all approved properties that fall inside it.

## Tech Stack

- **Go** with the [Gin](https://github.com/gin-gonic/gin) web framework
- **PostgreSQL / PostGIS** (via Supabase) for spatial queries, accessed with
  [pgx](https://github.com/jackc/pgx)
- **godotenv** for loading local environment variables

## Prerequisites

- Go installed (see `go.mod` for the required version)
- A running Postgres/Supabase database with the PostGIS extension enabled
  and a `search_properties(polygon)` SQL function defined
- Environment variables configured (see below)

## Environment Variables

Copy `.env.example` to `.env` and set:

| Variable         | Description                                              | Default                  |
|------------------|-----------------------------------------------------------|---------------------------|
| `DATABASE_URL`   | Postgres/Supabase connection string (required)             | –                         |
| `PORT`           | Port the service listens on                                | `8080`                    |
| `ALLOWED_ORIGIN` | Allowed CORS origin for the frontend                        | `http://localhost:5173`   |

## Running Locally

```bash
cd go-map-service
cp .env.example .env   # fill in DATABASE_URL etc.
go run .
```

The service starts on `http://localhost:8080` by default and logs a
successful database connection on startup.

## API Reference

### `POST /api/map/search`

Searches for approved properties whose location falls inside a given
polygon, with optional filters.

**Request body (JSON):**

| Field          | Type    | Required | Description                                   |
|----------------|---------|----------|------------------------------------------------|
| `polygon`      | string  | Yes      | WKT (Well-Known Text) polygon, e.g. `POLYGON((...))` |
| `beds`         | int     | No       | Minimum number of bedrooms                     |
| `baths`        | int     | No       | Minimum number of bathrooms                    |
| `type`         | string  | No       | Property type filter (e.g. `house`, `land`)    |
| `listing_type` | string  | No       | Listing type filter (e.g. `sale`, `rent`)      |

**Example request:**

```json
{
  "polygon": "POLYGON((79.8 6.9, 79.9 6.9, 79.9 7.0, 79.8 7.0, 79.8 6.9))",
  "beds": 2,
  "baths": 1,
  "type": "house",
  "listing_type": "sale"
}
```

**Example success response (`200 OK`):**

```json
{
  "properties": [
    {
      "id": "uuid",
      "title": "3BR House in Colombo",
      "description": "...",
      "price": 25000000,
      "latitude": 6.93,
      "longitude": 79.85,
      "images": ["https://..."],
      "bedrooms": 3,
      "bathrooms": 2,
      "land_size": 10,
      "type": "house",
      "city": "Colombo",
      "listing_type": "sale",
      "seller_name": "Jane Doe",
      "seller_role": "agent",
      "address": "Colombo"
    }
  ]
}
```

**Error responses:**

- `400 Bad Request` – the request body is missing `polygon` or is malformed.
- `500 Internal Server Error` – the database query failed.

Only properties with `status = 'approved'` are returned.

## Graceful Shutdown

The server listens for `SIGINT`/`SIGTERM` and shuts down gracefully with a
5-second timeout, allowing in-flight requests to complete.

## Testing

```bash
go test ./...
```
