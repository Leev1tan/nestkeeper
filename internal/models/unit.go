package models

// UnitStatus enum
type UnitStatus string

const (
	UnitStatusOccupied    UnitStatus = "occupied"
	UnitStatusVacant      UnitStatus = "vacant"
	UnitStatusMaintenance UnitStatus = "maintenance"
)

type Unit struct {
	BaseModel
	PropertyID      string     `gorm:"size:36;not null;index" json:"propertyId"`
	Name            string     `gorm:"not null" json:"name"`
	Bedrooms        int        `gorm:"default:0" json:"bedrooms"`
	Bathrooms       float64    `gorm:"default:0" json:"bathrooms"`
	SquareFeet      *int       `json:"squareFeet,omitempty"`
	MonthlyRent     float64    `gorm:"not null" json:"monthlyRent"`
	SecurityDeposit *float64   `json:"securityDeposit,omitempty"`
	Status          UnitStatus `gorm:"not null;default:vacant" json:"status"`

	// Relations
	Property   Property    `gorm:"foreignKey:PropertyID" json:"-"`
	Leases     []Lease     `gorm:"foreignKey:UnitID" json:"leases,omitempty"`
	Appliances []Appliance `gorm:"foreignKey:UnitID" json:"appliances,omitempty"`
}

func (Unit) TableName() string {
	return "units"
}
