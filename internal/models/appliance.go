package models

// ApplianceType enum
type ApplianceType string

const (
	ApplianceTypeRefrigerator     ApplianceType = "refrigerator"
	ApplianceTypeStove            ApplianceType = "stove"
	ApplianceTypeDishwasher       ApplianceType = "dishwasher"
	ApplianceTypeWasher           ApplianceType = "washer"
	ApplianceTypeDryer            ApplianceType = "dryer"
	ApplianceTypeHVAC             ApplianceType = "hvac"
	ApplianceTypeWaterHeater      ApplianceType = "water_heater"
	ApplianceTypeGarbageDisposal  ApplianceType = "garbage_disposal"
	ApplianceTypeMicrowave        ApplianceType = "microwave"
	ApplianceTypeOther            ApplianceType = "other"
)

type Appliance struct {
	BaseModel
	UnitID             string        `gorm:"size:36;not null;index" json:"unitId"`
	Type               ApplianceType `gorm:"not null" json:"type"`
	Brand              *string       `json:"brand,omitempty"`
	Model              *string       `json:"model,omitempty"`
	SerialNumber       *string       `json:"serialNumber,omitempty"`
	PurchaseDate       *string       `json:"purchaseDate,omitempty"`
	WarrantyExpiration *string       `json:"warrantyExpiration,omitempty"`
	LastServiceDate    *string       `json:"lastServiceDate,omitempty"`
	Notes              *string       `json:"notes,omitempty"`

	// Relations
	Unit Unit `gorm:"foreignKey:UnitID" json:"-"`
}

func (Appliance) TableName() string {
	return "appliances"
}
