package models

// PaymentMethod enum
type PaymentMethod string

const (
	PaymentMethodCash         PaymentMethod = "cash"
	PaymentMethodCheck        PaymentMethod = "check"
	PaymentMethodZelle        PaymentMethod = "zelle"
	PaymentMethodVenmo        PaymentMethod = "venmo"
	PaymentMethodPayPal       PaymentMethod = "paypal"
	PaymentMethodBankTransfer PaymentMethod = "bank_transfer"
	PaymentMethodOther        PaymentMethod = "other"
)

type RentPayment struct {
	BaseModel
	LeaseID         string        `gorm:"size:36;not null;index" json:"leaseId"`
	Amount          float64       `gorm:"not null" json:"amount"`
	LateFeeAmount   float64       `gorm:"default:0" json:"lateFeeAmount"`
	PaymentDate     string        `gorm:"not null;index" json:"paymentDate"`
	PeriodStart     string        `gorm:"not null" json:"periodStart"`
	PeriodEnd       string        `gorm:"not null" json:"periodEnd"`
	Method          PaymentMethod `gorm:"not null" json:"method"`
	CheckNumber     *string       `json:"checkNumber,omitempty"`
	ReferenceNumber *string       `json:"referenceNumber,omitempty"`
	Notes           *string       `json:"notes,omitempty"`

	// Relations
	Lease Lease `gorm:"foreignKey:LeaseID" json:"-"`
}

func (RentPayment) TableName() string {
	return "rent_payments"
}

// TotalAmount returns amount + late fee
func (p *RentPayment) TotalAmount() float64 {
	return p.Amount + p.LateFeeAmount
}
