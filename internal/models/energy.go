package models

type EnergyReading struct {
	BaseModel
	PropertyID        string    `json:"propertyId" gorm:"size:36;not null;index"`
	Property          *Property `json:"property,omitempty" gorm:"foreignKey:PropertyID"`
	ReadingDate       string    `json:"readingDate" gorm:"not null"` // YYYY-MM
	GridImportKwh     float64   `json:"gridImportKwh" gorm:"not null;default:0"`
	SolarGeneratedKwh float64   `json:"solarGeneratedKwh" gorm:"not null;default:0"`
	GridExportKwh     float64   `json:"gridExportKwh" gorm:"not null;default:0"` // sold back to grid
	GridPricePerKwh   float64   `json:"gridPricePerKwh" gorm:"not null;default:0"`
	Notes             *string   `json:"notes,omitempty"`
}

func (EnergyReading) TableName() string { return "energy_readings" }

// SolarSavings returns the money saved by solar generation
func (e EnergyReading) SolarSavings() float64 {
	return e.SolarGeneratedKwh * e.GridPricePerKwh
}

// GridCost returns the cost of electricity imported from the grid
func (e EnergyReading) GridCost() float64 {
	return e.GridImportKwh * e.GridPricePerKwh
}

// ExportEarnings returns money earned from selling back to the grid
func (e EnergyReading) ExportEarnings() float64 {
	return e.GridExportKwh * e.GridPricePerKwh
}
