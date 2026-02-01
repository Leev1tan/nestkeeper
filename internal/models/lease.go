package models

// LeaseStatus enum
type LeaseStatus string

const (
	LeaseStatusActive     LeaseStatus = "active"
	LeaseStatusExpired    LeaseStatus = "expired"
	LeaseStatusTerminated LeaseStatus = "terminated"
)

type Lease struct {
	BaseModel
	UnitID              string      `gorm:"size:36;not null;index" json:"unitId"`
	StartDate           string      `gorm:"not null" json:"startDate"`
	EndDate             string      `gorm:"not null" json:"endDate"`
	MonthlyRent         float64     `gorm:"not null" json:"monthlyRent"`
	SecurityDeposit     float64     `gorm:"not null" json:"securityDeposit"`
	RentDueDay          int         `gorm:"not null;default:1" json:"rentDueDay"`
	LateFeeAmount       *float64    `json:"lateFeeAmount,omitempty"`
	LateFeeGraceDays    int         `gorm:"default:5" json:"lateFeeGraceDays"`
	Status              LeaseStatus `gorm:"not null;default:active" json:"status"`
	RenewalReminderDays int         `gorm:"default:60" json:"renewalReminderDays"`

	// Relations
	Unit     Unit          `gorm:"foreignKey:UnitID" json:"-"`
	Tenants  []Tenant      `gorm:"many2many:lease_tenants;" json:"tenants,omitempty"`
	Payments []RentPayment `gorm:"foreignKey:LeaseID" json:"payments,omitempty"`
}

func (Lease) TableName() string {
	return "leases"
}

// LeaseTenant is the junction table for many-to-many relationship
type LeaseTenant struct {
	LeaseID   string `gorm:"size:36;primaryKey" json:"leaseId"`
	TenantID  string `gorm:"size:36;primaryKey" json:"tenantId"`
	IsPrimary bool   `gorm:"default:false" json:"isPrimary"`
}

func (LeaseTenant) TableName() string {
	return "lease_tenants"
}
