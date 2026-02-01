package models

type Tenant struct {
	BaseModel
	FirstName                   string  `gorm:"not null" json:"firstName"`
	LastName                    string  `gorm:"not null" json:"lastName"`
	Email                       *string `json:"email,omitempty"`
	Phone                       string  `gorm:"not null" json:"phone"`
	EmergencyContactName        *string `json:"emergencyContactName,omitempty"`
	EmergencyContactPhone       *string `json:"emergencyContactPhone,omitempty"`
	EmergencyContactRelationship *string `json:"emergencyContactRelationship,omitempty"`
	Notes                       *string `json:"notes,omitempty"`

	// Relations
	Leases []Lease `gorm:"many2many:lease_tenants;" json:"leases,omitempty"`
}

func (Tenant) TableName() string {
	return "tenants"
}

// FullName returns tenant's full name
func (t *Tenant) FullName() string {
	return t.FirstName + " " + t.LastName
}
