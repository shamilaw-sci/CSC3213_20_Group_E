package models

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
)

// ValidatePolygon validates WKT Polygon syntax, bounds, and vertex limits.
// Format: POLYGON((lng lat, lng lat, ...))
func ValidatePolygon(wkt string) error {
	trimmed := strings.TrimSpace(wkt)
	upper := strings.ToUpper(trimmed)

	if len(trimmed) > 4096 {
		return errors.New("polygon string exceeds maximum allowed length of 4096 characters")
	}

	if !strings.HasPrefix(upper, "POLYGON") {
		return errors.New("invalid WKT format: must start with 'POLYGON'")
	}

	// Extract content inside (( ... ))
	startIdx := strings.Index(upper, "((")
	endIdx := strings.LastIndex(upper, "))")
	if startIdx == -1 || endIdx == -1 || startIdx >= endIdx {
		return errors.New("invalid WKT format: missing double parentheses '((' and '))'")
	}

	coordString := trimmed[startIdx+2 : endIdx]
	points := strings.Split(coordString, ",")
	if len(points) < 4 {
		return errors.New("a valid closed polygon must contain at least 4 coordinate pairs")
	}

	if len(points) > 100 {
		return errors.New("polygon exceeds maximum allowed vertex count (100 vertices)")
	}

	for i, pointStr := range points {
		coords := strings.Fields(strings.TrimSpace(pointStr))
		if len(coords) != 2 {
			return fmt.Errorf("point %d is malformed; expected 'longitude latitude'", i+1)
		}

		lng, err := strconv.ParseFloat(coords[0], 64)
		if err != nil || lng < -180.0 || lng > 180.0 {
			return fmt.Errorf("point %d has invalid longitude (%s); must be between -180 and 180", i+1, coords[0])
		}

		lat, err := strconv.ParseFloat(coords[1], 64)
		if err != nil || lat < -90.0 || lat > 90.0 {
			return fmt.Errorf("point %d has invalid latitude (%s); must be between -90 and 90", i+1, coords[1])
		}
	}

	return nil
}
