package models

import (
	"testing"
)

func TestValidatePolygon_Valid(t *testing.T) {
	validPolygons := []string{
		"POLYGON((79.8 6.9, 79.9 6.9, 79.9 7.0, 79.8 7.0, 79.8 6.9))",
		"polygon((0 0, 0 1, 1 1, 1 0, 0 0))",
		"POLYGON ((-122.4 37.7, -122.3 37.7, -122.3 37.8, -122.4 37.8, -122.4 37.7))",
	}

	for _, p := range validPolygons {
		if err := ValidatePolygon(p); err != nil {
			t.Errorf("Expected polygon '%s' to be valid, got error: %v", p, err)
		}
	}
}

func TestValidatePolygon_Invalid(t *testing.T) {
	invalidCases := []struct {
		polygon string
		errMsg  string
	}{
		{"", "must start with 'POLYGON'"},
		{"POINT(0 0)", "must start with 'POLYGON'"},
		{"POLYGON(0 0, 1 1)", "missing double parentheses"},
		{"POLYGON((0 0, 1 1))", "at least 4 coordinate pairs"},
		{"POLYGON((200 0, 0 1, 1 1, 0 0))", "invalid longitude"},
		{"POLYGON((0 150, 0 1, 1 1, 0 0))", "invalid latitude"},
		{"POLYGON((abc def, 0 1, 1 1, 0 0))", "invalid longitude"},
	}

	for _, tc := range invalidCases {
		err := ValidatePolygon(tc.polygon)
		if err == nil {
			t.Errorf("Expected error for polygon '%s', but got nil", tc.polygon)
		}
	}
}
