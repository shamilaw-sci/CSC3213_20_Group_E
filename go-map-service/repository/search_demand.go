package repository

import (
	"context"
	"time"
)

// Called after a successful submitted search, outside the result cache. The same
// opaque event UUID deduplicates retries across Go and Node in one transaction.
func (r *MapRepository) RecordSearchDemand(ctx context.Context, eventID, district string) error {
	ctx, cancel := context.WithTimeout(ctx, 800*time.Millisecond)
	defer cancel()
	_, err := r.Pool.Exec(ctx, "select public.record_district_search($1::uuid, $2::text)", eventID, district)
	return err
}
