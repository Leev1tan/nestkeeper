package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// BaseModel includes common fields for all models
type BaseModel struct {
	ID        string         `gorm:"primaryKey;size:36" json:"id"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// BeforeCreate generates UUID before inserting
func (b *BaseModel) BeforeCreate(tx *gorm.DB) error {
	if b.ID == "" {
		b.ID = uuid.New().String()
	}
	return nil
}
