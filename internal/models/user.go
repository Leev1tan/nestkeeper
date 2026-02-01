package models

import "time"

type SubscriptionTier string

const (
	TierFree SubscriptionTier = "free"
	TierPro  SubscriptionTier = "pro"
)

type User struct {
	ID                 string           `json:"id" gorm:"primaryKey"`
	Username           string           `json:"username" gorm:"uniqueIndex;not null"`
	PasswordHash       string           `json:"-" gorm:"not null"`
	Email              string           `json:"email"`
	SubscriptionTier   SubscriptionTier `json:"subscriptionTier" gorm:"default:free"`
	StripeCustomerID   string           `json:"-"`
	StripeSubscriptionID string         `json:"-"`
	SubscriptionEndsAt *time.Time       `json:"subscriptionEndsAt"`
	CreatedAt          time.Time        `json:"createdAt"`
	UpdatedAt          time.Time        `json:"updatedAt"`
}

func (u *User) IsPro() bool {
	if u.SubscriptionTier != TierPro {
		return false
	}
	if u.SubscriptionEndsAt != nil && u.SubscriptionEndsAt.Before(time.Now()) {
		return false
	}
	return true
}

type Session struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	UserID    string    `json:"userId" gorm:"not null"`
	User      User      `json:"-" gorm:"foreignKey:UserID"`
	ExpiresAt time.Time `json:"expiresAt"`
	CreatedAt time.Time `json:"createdAt"`
}
