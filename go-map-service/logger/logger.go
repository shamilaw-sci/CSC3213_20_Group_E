package logger

import (
	"log"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// InitLogger initializes the global zap logger
func InitLogger() {
	config := zap.NewProductionConfig()
	
	// Customizing the time format for better readability
	config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	
	logger, err := config.Build()
	if err != nil {
		log.Fatalf("Failed to initialize zap logger: %v", err)
	}

	// Replace the global zap logger (accessible via zap.L())
	zap.ReplaceGlobals(logger)
}

// Sync flushes any buffered log entries
func Sync() {
	_ = zap.L().Sync()
}
