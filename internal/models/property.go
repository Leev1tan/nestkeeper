package models

// PropertyType enum
type PropertyType string

const (
	PropertyTypeSingleFamily PropertyType = "single_family"
	PropertyTypeMultiFamily  PropertyType = "multi_family"
	PropertyTypeCondo        PropertyType = "condo"
	PropertyTypeTownhouse    PropertyType = "townhouse"
)

type Property struct {
	BaseModel
	AddressStreet  string       `gorm:"not null" json:"addressStreet"`
	AddressCity    string       `gorm:"not null" json:"addressCity"`
	AddressState   string       `gorm:"size:2;not null" json:"addressState"`
	AddressZip     string       `gorm:"not null" json:"addressZip"`
	AddressCountry string       `gorm:"default:USA" json:"addressCountry"`
	PropertyType   PropertyType `gorm:"not null" json:"propertyType"`
	PurchaseDate   *string      `json:"purchaseDate,omitempty"`
	PurchasePrice  *float64     `json:"purchasePrice,omitempty"`
	CurrentValue   *float64     `json:"currentValue,omitempty"`
	Notes          *string      `json:"notes,omitempty"`

	// Relations
	Units []Unit `gorm:"foreignKey:PropertyID" json:"units,omitempty"`
}

func (Property) TableName() string {
	return "properties"
}

// FullAddress returns formatted address string
func (p *Property) FullAddress() string {
	return p.AddressStreet + ", " + p.AddressCity + ", " + p.AddressState + " " + p.AddressZip
}
