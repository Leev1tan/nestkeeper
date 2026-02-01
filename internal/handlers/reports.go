package handlers

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"nestkeeper/internal/db"
	"nestkeeper/internal/models"
)

// Schedule E expense categories
var ScheduleECategories = map[string]string{
	"advertising":       "Advertising",
	"auto_travel":       "Auto and travel",
	"cleaning_maintenance": "Cleaning and maintenance",
	"commissions":       "Commissions",
	"insurance":         "Insurance",
	"legal_professional": "Legal and other professional fees",
	"management_fees":   "Management fees",
	"mortgage_interest": "Mortgage interest",
	"other_interest":    "Other interest",
	"repairs":           "Repairs",
	"supplies":          "Supplies",
	"taxes":             "Taxes",
	"utilities":         "Utilities",
	"depreciation":      "Depreciation expense or depletion",
	"other":             "Other",
}

type TaxReportResponse struct {
	Year       int                    `json:"year"`
	Properties []PropertyTaxSummary   `json:"properties"`
	Totals     TaxTotals              `json:"totals"`
}

type PropertyTaxSummary struct {
	PropertyID string                 `json:"propertyId"`
	Address    string                 `json:"address"`
	Income     IncomeBreakdown        `json:"income"`
	Expenses   map[string]float64     `json:"expenses"`
	NetIncome  float64                `json:"netIncome"`
}

type IncomeBreakdown struct {
	RentsReceived float64 `json:"rentsReceived"`
	OtherIncome   float64 `json:"otherIncome"`
	TotalIncome   float64 `json:"totalIncome"`
}

type TaxTotals struct {
	TotalRents    float64            `json:"totalRents"`
	TotalExpenses float64            `json:"totalExpenses"`
	NetIncome     float64            `json:"netIncome"`
	ByCategory    map[string]float64 `json:"byCategory"`
}

type CashFlowResponse struct {
	StartDate  string           `json:"startDate"`
	EndDate    string           `json:"endDate"`
	Income     float64          `json:"income"`
	Expenses   float64          `json:"expenses"`
	NetCashFlow float64         `json:"netCashFlow"`
	ByProperty []PropertyCashFlow `json:"byProperty"`
	ByMonth    []MonthlyCashFlow  `json:"byMonth"`
}

type PropertyCashFlow struct {
	PropertyID string  `json:"propertyId"`
	Address    string  `json:"address"`
	Income     float64 `json:"income"`
	Expenses   float64 `json:"expenses"`
	Net        float64 `json:"net"`
}

type MonthlyCashFlow struct {
	Month    string  `json:"month"`
	Income   float64 `json:"income"`
	Expenses float64 `json:"expenses"`
	Net      float64 `json:"net"`
}

func GetTaxReport(c echo.Context) error {
	yearStr := c.Param("year")
	year, err := strconv.Atoi(yearStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid year"})
	}

	startDate := strconv.Itoa(year) + "-01-01"
	endDate := strconv.Itoa(year) + "-12-31"

	// Get all properties
	var properties []models.Property
	db.DB.Find(&properties)

	var propertySummaries []PropertyTaxSummary
	totals := TaxTotals{
		ByCategory: make(map[string]float64),
	}

	for _, property := range properties {
		// Get rent income for this property
		var rentIncome float64
		db.DB.Model(&models.RentPayment{}).
			Joins("JOIN leases ON leases.id = rent_payments.lease_id").
			Joins("JOIN units ON units.id = leases.unit_id").
			Where("units.property_id = ? AND rent_payments.payment_date >= ? AND rent_payments.payment_date <= ?",
				property.ID, startDate, endDate).
			Select("COALESCE(SUM(rent_payments.amount + rent_payments.late_fee_amount), 0)").
			Scan(&rentIncome)

		// Get expenses by category
		var expenses []struct {
			Category string
			Total    float64
		}
		db.DB.Model(&models.Expense{}).
			Select("category, SUM(amount) as total").
			Where("property_id = ? AND date >= ? AND date <= ? AND tax_deductible = ?",
				property.ID, startDate, endDate, true).
			Group("category").
			Scan(&expenses)

		expenseMap := make(map[string]float64)
		var totalExpenses float64
		for _, e := range expenses {
			expenseMap[e.Category] = e.Total
			totalExpenses += e.Total
			totals.ByCategory[e.Category] += e.Total
		}

		summary := PropertyTaxSummary{
			PropertyID: property.ID,
			Address:    property.AddressStreet + ", " + property.AddressCity + ", " + property.AddressState,
			Income: IncomeBreakdown{
				RentsReceived: rentIncome,
				OtherIncome:   0,
				TotalIncome:   rentIncome,
			},
			Expenses:  expenseMap,
			NetIncome: rentIncome - totalExpenses,
		}

		propertySummaries = append(propertySummaries, summary)
		totals.TotalRents += rentIncome
		totals.TotalExpenses += totalExpenses
	}

	totals.NetIncome = totals.TotalRents - totals.TotalExpenses

	return c.JSON(http.StatusOK, TaxReportResponse{
		Year:       year,
		Properties: propertySummaries,
		Totals:     totals,
	})
}

func GetCashFlowReport(c echo.Context) error {
	startDate := c.QueryParam("startDate")
	endDate := c.QueryParam("endDate")

	if startDate == "" || endDate == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "startDate and endDate are required"})
	}

	// Get all properties
	var properties []models.Property
	db.DB.Find(&properties)

	var propertyFlows []PropertyCashFlow
	var totalIncome, totalExpenses float64

	for _, property := range properties {
		// Get rent income
		var income float64
		db.DB.Model(&models.RentPayment{}).
			Joins("JOIN leases ON leases.id = rent_payments.lease_id").
			Joins("JOIN units ON units.id = leases.unit_id").
			Where("units.property_id = ? AND rent_payments.payment_date >= ? AND rent_payments.payment_date <= ?",
				property.ID, startDate, endDate).
			Select("COALESCE(SUM(rent_payments.amount + rent_payments.late_fee_amount), 0)").
			Scan(&income)

		// Get expenses
		var expenses float64
		db.DB.Model(&models.Expense{}).
			Where("property_id = ? AND date >= ? AND date <= ?",
				property.ID, startDate, endDate).
			Select("COALESCE(SUM(amount), 0)").
			Scan(&expenses)

		propertyFlows = append(propertyFlows, PropertyCashFlow{
			PropertyID: property.ID,
			Address:    property.AddressStreet + ", " + property.AddressCity,
			Income:     income,
			Expenses:   expenses,
			Net:        income - expenses,
		})

		totalIncome += income
		totalExpenses += expenses
	}

	return c.JSON(http.StatusOK, CashFlowResponse{
		StartDate:   startDate,
		EndDate:     endDate,
		Income:      totalIncome,
		Expenses:    totalExpenses,
		NetCashFlow: totalIncome - totalExpenses,
		ByProperty:  propertyFlows,
		ByMonth:     []MonthlyCashFlow{}, // TODO: Implement monthly breakdown
	})
}
