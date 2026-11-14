package handlers

import (
	"context"
	"crypto/sha256"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type demandRecorder interface {
	RecordSearchDemand(context.Context, string, string) error
}
type demandBucket struct {
	count   int
	expires time.Time
}

var demandMu sync.Mutex
var demandBuckets = map[[32]byte]demandBucket{}
var demandUUID = regexp.MustCompile(`(?i)^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)
var demandDistricts = []string{"Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"}

func (h *MapHandler) recordDemand(c *gin.Context, eventID, submittedDistrict string) {
	if !demandUUID.MatchString(eventID) {
		return
	}
	district := ""
	normalized := strings.Join(strings.Fields(submittedDistrict), " ")
	for _, candidate := range demandDistricts {
		if strings.EqualFold(candidate, normalized) {
			district = candidate
			break
		}
	}
	recorder, ok := h.Repo.(demandRecorder)
	if district == "" || !ok {
		return
	}
	// In-memory only, no request IP or raw search data stored in analytics.
	key := sha256.Sum256([]byte(c.ClientIP()))
	now := time.Now()
	demandMu.Lock()
	for k, bucket := range demandBuckets {
		if now.After(bucket.expires) {
			delete(demandBuckets, k)
		}
	}
	bucket, exists := demandBuckets[key]
	if !exists {
		bucket = demandBucket{expires: now.Add(time.Minute)}
	}
	if bucket.count >= 20 || (!exists && len(demandBuckets) >= 10000) {
		demandMu.Unlock()
		return
	}
	bucket.count++
	demandBuckets[key] = bucket
	demandMu.Unlock()
	// Bounded database timeout; failure never changes a successful search response.
	if err := recorder.RecordSearchDemand(c.Request.Context(), eventID, district); err != nil {
		zap.L().Warn("District search recording unavailable")
	}
}
