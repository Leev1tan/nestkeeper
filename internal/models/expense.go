package models

// ExpenseCategory maps to IRS Schedule E categories
type ExpenseCategory string

const (
	ExpenseCategoryAdvertising        ExpenseCategory = "advertising"
	ExpenseCategoryAutoTravel         ExpenseCategory = "auto_travel"
	ExpenseCategoryCleaningMaintenance ExpenseCategory = "cleaning_maintenance"
	ExpenseCategoryCommissions        ExpenseCategory = "commissions"
	ExpenseCategoryInsurance          ExpenseCategory = "insurance"
	ExpenseCategoryLegalProfessional  ExpenseCategory = "legal_professional"
	ExpenseCategoryManagementFees     ExpenseCategory = "management_fees"
	ExpenseCategoryMortgageInterest   ExpenseCategory = "mortgage_interest"
	ExpenseCategoryOtherInterest      ExpenseCategory = "other_interest"
	ExpenseCategoryRepairs            ExpenseCategory = "repairs"
	ExpenseCategorySupplies           ExpenseCategory = "supplies"
	ExpenseCategoryTaxes              ExpenseCategory = "taxes"
	ExpenseCategoryUtilities          ExpenseCategory = "utilities"
	ExpenseCategoryDepreciation       ExpenseCategory = "depreciation"
	ExpenseCategoryOther              ExpenseCategory = "other"
)

// ExpensePaymentMethod enum
type ExpensePaymentMethod string

const (
	ExpensePaymentCash         ExpensePaymentMethod = "cash"
	ExpensePaymentCreditCard   ExpensePaymentMethod = "credit_card"
	ExpensePaymentDebitCard    ExpensePaymentMethod = "debit_card"
	ExpensePaymentCheck        ExpensePaymentMethod = "check"
	ExpensePaymentBankTransfer ExpensePaymentMethod = "bank_transfer"
)

type Expense struct {
	BaseModel
	PropertyID         *string              `gorm:"size:36;index" json:"propertyId,omitempty"`
	UnitID             *string              `gorm:"size:36" json:"unitId,omitempty"`
	Amount             float64              `gorm:"not null" json:"amount"`
	Date               string               `gorm:"not null;index" json:"date"`
	Category           ExpenseCategory      `gorm:"not null;index" json:"category"`
	Vendor             *string              `json:"vendor,omitempty"`
	Description        *string              `json:"description,omitempty"`
	ReceiptPath        *string              `json:"receiptPath,omitempty"`
	PaymentMethod      *ExpensePaymentMethod `json:"paymentMethod,omitempty"`
	IsRecurring        bool                 `gorm:"default:false" json:"isRecurring"`
	RecurringExpenseID *string              `gorm:"size:36" json:"recurringExpenseId,omitempty"`
	TaxDeductible      bool                 `gorm:"default:true" json:"taxDeductible"`

	// Relations
	Property *Property `gorm:"foreignKey:PropertyID" json:"-"`
	Unit     *Unit     `gorm:"foreignKey:UnitID" json:"-"`
}

func (Expense) TableName() string {
	return "expenses"
}

// RecurringExpense for auto-generated expenses
type RecurringExpense struct {
	BaseModel
	PropertyID  *string         `gorm:"size:36" json:"propertyId,omitempty"`
	Amount      float64         `gorm:"not null" json:"amount"`
	Category    ExpenseCategory `gorm:"not null" json:"category"`
	Vendor      *string         `json:"vendor,omitempty"`
	Description *string         `json:"description,omitempty"`
	Frequency   string          `gorm:"not null" json:"frequency"` // monthly, quarterly, annually
	DayOfMonth  *int            `json:"dayOfMonth,omitempty"`
	MonthOfYear *int            `json:"monthOfYear,omitempty"`
	AutoCreate  bool            `gorm:"default:true" json:"autoCreate"`
	NextDueDate string          `gorm:"not null" json:"nextDueDate"`

	// Relations
	Property *Property `gorm:"foreignKey:PropertyID" json:"-"`
}

func (RecurringExpense) TableName() string {
	return "recurring_expenses"
}
