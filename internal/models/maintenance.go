package models

// MaintenanceCategory enum
type MaintenanceCategory string

const (
	MaintenanceCategorySafety      MaintenanceCategory = "safety"
	MaintenanceCategoryHVAC        MaintenanceCategory = "hvac"
	MaintenanceCategoryPlumbing    MaintenanceCategory = "plumbing"
	MaintenanceCategoryElectrical  MaintenanceCategory = "electrical"
	MaintenanceCategoryExterior    MaintenanceCategory = "exterior"
	MaintenanceCategoryInterior    MaintenanceCategory = "interior"
	MaintenanceCategoryPestControl MaintenanceCategory = "pest_control"
	MaintenanceCategoryAppliance   MaintenanceCategory = "appliance"
	MaintenanceCategoryOther       MaintenanceCategory = "other"
)

// MaintenanceFrequency enum
type MaintenanceFrequency string

const (
	MaintenanceFrequencyOneTime     MaintenanceFrequency = "one_time"
	MaintenanceFrequencyMonthly     MaintenanceFrequency = "monthly"
	MaintenanceFrequencyQuarterly   MaintenanceFrequency = "quarterly"
	MaintenanceFrequencyEvery6Months MaintenanceFrequency = "every_6_months"
	MaintenanceFrequencyAnnually    MaintenanceFrequency = "annually"
	MaintenanceFrequencyCustom      MaintenanceFrequency = "custom"
)

// MaintenanceStatus enum
type MaintenanceStatus string

const (
	MaintenanceStatusPending   MaintenanceStatus = "pending"
	MaintenanceStatusOverdue   MaintenanceStatus = "overdue"
	MaintenanceStatusCompleted MaintenanceStatus = "completed"
	MaintenanceStatusSkipped   MaintenanceStatus = "skipped"
)

type MaintenanceTask struct {
	BaseModel
	PropertyID          *string              `gorm:"size:36;index" json:"propertyId,omitempty"`
	UnitID              *string              `gorm:"size:36" json:"unitId,omitempty"`
	TemplateID          *string              `json:"templateId,omitempty"`
	Name                string               `gorm:"not null" json:"name"`
	Description         *string              `json:"description,omitempty"`
	Category            MaintenanceCategory  `gorm:"not null" json:"category"`
	Frequency           MaintenanceFrequency `gorm:"not null" json:"frequency"`
	CustomFrequencyDays *int                 `json:"customFrequencyDays,omitempty"`
	DueDate             string               `gorm:"not null;index" json:"dueDate"`
	ReminderDays        *string              `json:"reminderDays,omitempty"` // JSON array: "[7, 3, 1, 0]"
	Status              MaintenanceStatus    `gorm:"not null;default:pending;index" json:"status"`
	CompletedDate       *string              `json:"completedDate,omitempty"`
	CompletedNotes      *string              `json:"completedNotes,omitempty"`
	LinkedExpenseID     *string              `gorm:"size:36" json:"linkedExpenseId,omitempty"`
	EstimatedCost       *float64             `json:"estimatedCost,omitempty"`
	ActualCost          *float64             `json:"actualCost,omitempty"`
	Vendor              *string              `json:"vendor,omitempty"`
	RequiredByLaw       bool                 `gorm:"default:false" json:"requiredByLaw"`

	// Relations
	Property      *Property `gorm:"foreignKey:PropertyID" json:"-"`
	Unit          *Unit     `gorm:"foreignKey:UnitID" json:"-"`
	LinkedExpense *Expense  `gorm:"foreignKey:LinkedExpenseID" json:"-"`
}

func (MaintenanceTask) TableName() string {
	return "maintenance_tasks"
}
