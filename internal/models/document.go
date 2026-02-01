package models

// DocumentType enum
type DocumentType string

const (
	DocumentTypeLease          DocumentType = "lease"
	DocumentTypeInsurance      DocumentType = "insurance"
	DocumentTypeDeed           DocumentType = "deed"
	DocumentTypeInspection     DocumentType = "inspection"
	DocumentTypeReceipt        DocumentType = "receipt"
	DocumentTypePhoto          DocumentType = "photo"
	DocumentTypeCorrespondence DocumentType = "correspondence"
	DocumentTypeTax            DocumentType = "tax"
	DocumentTypeOther          DocumentType = "other"
)

type Document struct {
	BaseModel
	Name           string       `gorm:"not null" json:"name"`
	Type           DocumentType `gorm:"not null" json:"type"`
	FilePath       string       `gorm:"not null" json:"filePath"`
	FileSize       *int64       `json:"fileSize,omitempty"`
	MimeType       *string      `json:"mimeType,omitempty"`
	PropertyID     *string      `gorm:"size:36" json:"propertyId,omitempty"`
	UnitID         *string      `gorm:"size:36" json:"unitId,omitempty"`
	TenantID       *string      `gorm:"size:36" json:"tenantId,omitempty"`
	ExpenseID      *string      `gorm:"size:36" json:"expenseId,omitempty"`
	Tags           *string      `json:"tags,omitempty"` // JSON array
	ExpirationDate *string      `json:"expirationDate,omitempty"`
	Encrypted      bool         `gorm:"default:false" json:"encrypted"`

	// Relations
	Property *Property `gorm:"foreignKey:PropertyID" json:"-"`
	Unit     *Unit     `gorm:"foreignKey:UnitID" json:"-"`
	Tenant   *Tenant   `gorm:"foreignKey:TenantID" json:"-"`
	Expense  *Expense  `gorm:"foreignKey:ExpenseID" json:"-"`
}

func (Document) TableName() string {
	return "documents"
}
