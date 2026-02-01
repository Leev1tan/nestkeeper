package config

import (
	"os"
	"path/filepath"
)

type Config struct {
	Port         string
	DatabasePath string
	UploadPath   string
	BackupPath   string
	Environment  string
}

func Load() *Config {
	return &Config{
		Port:         getEnv("PORT", "3000"),
		DatabasePath: getEnv("DATABASE_PATH", filepath.Join("data", "nestkeeper.db")),
		UploadPath:   getEnv("UPLOAD_PATH", filepath.Join("data", "documents")),
		BackupPath:   getEnv("BACKUP_PATH", filepath.Join("data", "backups")),
		Environment:  getEnv("ENVIRONMENT", "development"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func (c *Config) IsDevelopment() bool {
	return c.Environment == "development"
}

func (c *Config) IsProduction() bool {
	return c.Environment == "production"
}
