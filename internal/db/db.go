package db

import (
	"log"
	"os"
	"path/filepath"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"nestkeeper/internal/models"
)

var DB *gorm.DB

// Init connects to the database and runs migrations
func Init(databasePath string) error {
	if err := Connect(databasePath); err != nil {
		return err
	}
	return Migrate()
}

func Connect(databasePath string) error {
	// Ensure directory exists
	dir := filepath.Dir(databasePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	// Configure GORM logger
	gormLogger := logger.Default.LogMode(logger.Info)

	// Connect to SQLite
	var err error
	DB, err = gorm.Open(sqlite.Open(databasePath), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		return err
	}

	// Enable foreign keys
	DB.Exec("PRAGMA foreign_keys = ON")

	log.Printf("Connected to database: %s", databasePath)
	return nil
}

func Migrate() error {
	log.Println("Running database migrations...")

	err := DB.AutoMigrate(
		&models.User{},
		&models.Session{},
		&models.Property{},
		&models.Unit{},
		&models.Tenant{},
		&models.Lease{},
		&models.LeaseTenant{},
		&models.RentPayment{},
		&models.Expense{},
		&models.RecurringExpense{},
		&models.MaintenanceTask{},
		&models.Document{},
		&models.Appliance{},
		&models.Setting{},
	)
	if err != nil {
		return err
	}

	log.Println("Migrations completed successfully")
	return nil
}

func Close() error {
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
