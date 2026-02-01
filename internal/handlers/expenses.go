package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"nestkeeper/internal/db"
	"nestkeeper/internal/models"
)

type CreateExpenseRequest struct {
	PropertyID         *string  `json:"propertyId"`
	UnitID             *string  `json:"unitId"`
	Amount             float64  `json:"amount" validate:"required,gt=0"`
	Date               string   `json:"date" validate:"required"`
	Category           string   `json:"category" validate:"required"`
	Vendor             *string  `json:"vendor"`
	Description        *string  `json:"description"`
	ReceiptPath        *string  `json:"receiptPath"`
	PaymentMethod      *string  `json:"paymentMethod"`
	IsRecurring        bool     `json:"isRecurring"`
	RecurringExpenseID *string  `json:"recurringExpenseId"`
	TaxDeductible      *bool    `json:"taxDeductible"`
}

func ListExpenses(c echo.Context) error {
	propertyID := c.QueryParam("propertyId")
	category := c.QueryParam("category")
	startDate := c.QueryParam("startDate")
	endDate := c.QueryParam("endDate")

	var expenses []models.Expense
	query := db.DB.Order("date DESC")

	if propertyID != "" {
		query = query.Where("property_id = ?", propertyID)
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if startDate != "" {
		query = query.Where("date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("date <= ?", endDate)
	}

	result := query.Find(&expenses)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch expenses"})
	}

	return c.JSON(http.StatusOK, expenses)
}

func CreateExpense(c echo.Context) error {
	var req CreateExpenseRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
	}

	taxDeductible := true
	if req.TaxDeductible != nil {
		taxDeductible = *req.TaxDeductible
	}

	var paymentMethod *models.ExpensePaymentMethod
	if req.PaymentMethod != nil {
		pm := models.ExpensePaymentMethod(*req.PaymentMethod)
		paymentMethod = &pm
	}

	expense := models.Expense{
		PropertyID:         req.PropertyID,
		UnitID:             req.UnitID,
		Amount:             req.Amount,
		Date:               req.Date,
		Category:           models.ExpenseCategory(req.Category),
		Vendor:             req.Vendor,
		Description:        req.Description,
		ReceiptPath:        req.ReceiptPath,
		PaymentMethod:      paymentMethod,
		IsRecurring:        req.IsRecurring,
		RecurringExpenseID: req.RecurringExpenseID,
		TaxDeductible:      taxDeductible,
	}

	result := db.DB.Create(&expense)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create expense"})
	}

	return c.JSON(http.StatusCreated, expense)
}

func GetExpense(c echo.Context) error {
	id := c.Param("id")

	var expense models.Expense
	result := db.DB.First(&expense, "id = ?", id)
	if result.Error != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Expense not found"})
	}

	return c.JSON(http.StatusOK, expense)
}

func UpdateExpense(c echo.Context) error {
	id := c.Param("id")

	var expense models.Expense
	if err := db.DB.First(&expense, "id = ?", id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Expense not found"})
	}

	var req CreateExpenseRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
	}

	updates := map[string]interface{}{
		"amount":      req.Amount,
		"date":        req.Date,
		"category":    req.Category,
		"is_recurring": req.IsRecurring,
	}

	if req.PropertyID != nil {
		updates["property_id"] = req.PropertyID
	}
	if req.UnitID != nil {
		updates["unit_id"] = req.UnitID
	}
	if req.Vendor != nil {
		updates["vendor"] = req.Vendor
	}
	if req.Description != nil {
		updates["description"] = req.Description
	}
	if req.ReceiptPath != nil {
		updates["receipt_path"] = req.ReceiptPath
	}
	if req.PaymentMethod != nil {
		updates["payment_method"] = req.PaymentMethod
	}
	if req.TaxDeductible != nil {
		updates["tax_deductible"] = req.TaxDeductible
	}

	db.DB.Model(&expense).Updates(updates)

	return c.JSON(http.StatusOK, expense)
}

func DeleteExpense(c echo.Context) error {
	id := c.Param("id")

	result := db.DB.Delete(&models.Expense{}, "id = ?", id)
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Expense not found"})
	}

	return c.JSON(http.StatusOK, map[string]string{"success": "true"})
}
