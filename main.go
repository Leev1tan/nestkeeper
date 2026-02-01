package main

import (
	"log"
	"os"

	"nestkeeper/internal/config"
	"nestkeeper/internal/db"
	"nestkeeper/internal/server"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	if err := db.Init(cfg.DatabasePath); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Create and start server
	e := server.New()

	// Get port from config or default
	port := cfg.Port
	if port == "" {
		port = "3000"
	}

	log.Printf("Starting NestKeeper on port %s", port)
	log.Printf("Database: %s", cfg.DatabasePath)

	if err := e.Start(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
		os.Exit(1)
	}
}
