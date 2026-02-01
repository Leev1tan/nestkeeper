package handlers

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"nestkeeper/internal/db"
	"nestkeeper/internal/models"
)

type CreatePaymentRequest struct {
	LeaseID         string  `json:"leaseId" validate:"required,uuid"`
	Amount          float64 `json:"amount" validate:"required,gt=0"`
	LateFeeAmount   float64 `json:"lateFeeAmount"`
	PaymentDate     string  `json:"paymentDate" validate:"required"`
	PeriodStart     string  `json:"periodStart" validate:"required"`
	PeriodEnd       string  `json:"periodEnd" validate:"required"`
	Method          string  `json:"method" validate:"required,oneof=cash check zelle venmo paypal bank_transfer other"`
	CheckNumber     *string `json:"checkNumber"`
	ReferenceNumber *string `json:"referenceNumber"`
	Notes           *string `json:"notes"`
}

type RentStatusResponse struct {
	Period  PeriodInfo          `json:"period"`
	Summary RentSummary         `json:"summary"`
	Units   []UnitRentStatus    `json:"units"`
}

type PeriodInfo struct {
	Start string `json:"start"`
	End   string `json:"end"`
}

type RentSummary struct {
	TotalExpected    float64 `json:"totalExpected"`
	TotalReceived    float64 `json:"totalReceived"`
	TotalOutstanding float64 `json:"totalOutstanding"`
	PaidCount        int     `json:"paidCount"`
	PartialCount     int     `json:"partialCount"`
	OverdueCount     int     `json:"overdueCount"`
}

type UnitRentStatus struct {
	LeaseID     string         `json:"leaseId"`
	Property    PropertyInfo   `json:"property"`
	Unit        UnitInfo       `json:"unit"`
	Tenants     []TenantInfo   `json:"tenants"`
	AmountDue   float64        `json:"amountDue"`
	TotalPaid   float64        `json:"totalPaid"`
	Balance     float64        `json:"balance"`
	Status      string         `json:"status"`
	DueDate     string         `json:"dueDate"`
	DaysOverdue int            `json:"daysOverdue"`
	Payments    []PaymentInfo  `json:"payments"`
}

type PropertyInfo struct {
	ID      string `json:"id"`
	Address string `json:"address"`
}

type UnitInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type TenantInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type PaymentInfo struct {
	ID      string  `json:"id"`
	Amount  float64 `json:"amount"`
	LateFee float64 `json:"lateFee"`
	Date    string  `json:"date"`
	Method  string  `json:"method"`
}

func GetRentStatus(c echo.Context) error {
	monthParam := c.QueryParam("month")

	var targetDate time.Time
	if monthParam != "" {
		parsed, err := time.Parse("2006-01", monthParam)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid month format. Use YYYY-MM"})
		}
		targetDate = parsed
	} else {
		targetDate = time.Now()
	}

	year := targetDate.Year()
	month := targetDate.Month()

	periodStart := time.Date(year, month, 1, 0, 0, 0, 0, time.UTC).Format("2006-01-02")
	periodEnd := time.Date(year, month+1, 0, 0, 0, 0, 0, time.UTC).Format("2006-01-02")

	// Get active leases with unit and property info
	var leases []models.Lease
	db.DB.Preload("Tenants").
		Where("status = ?", "active").
		Find(&leases)

	var unitStatuses []UnitRentStatus
	var summary RentSummary

	for _, lease := range leases {
		// Get unit and property
		var unit models.Unit
		db.DB.Preload("Property").First(&unit, "id = ?", lease.UnitID)

		// Get payments for this period
		var payments []models.RentPayment
		db.DB.Where("lease_id = ? AND period_start >= ? AND period_end <= ?",
			lease.ID, periodStart, periodEnd).Find(&payments)

		var totalPaid float64
		var paymentInfos []PaymentInfo
		for _, p := range payments {
			totalPaid += p.Amount + p.LateFeeAmount
			paymentInfos = append(paymentInfos, PaymentInfo{
				ID:      p.ID,
				Amount:  p.Amount,
				LateFee: p.LateFeeAmount,
				Date:    p.PaymentDate,
				Method:  string(p.Method),
			})
		}

		// Calculate status
		dueDate := time.Date(year, month, lease.RentDueDay, 0, 0, 0, 0, time.UTC)
		today := time.Now()

		var status string
		var daysOverdue int

		if totalPaid >= lease.MonthlyRent {
			status = "paid"
			summary.PaidCount++
		} else if totalPaid > 0 {
			status = "partial"
			summary.PartialCount++
		} else if today.After(dueDate) {
			status = "overdue"
			daysOverdue = int(today.Sub(dueDate).Hours() / 24)
			summary.OverdueCount++
		} else {
			status = "unpaid"
		}

		// Build tenant list
		var tenants []TenantInfo
		for _, t := range lease.Tenants {
			tenants = append(tenants, TenantInfo{
				ID:   t.ID,
				Name: t.FirstName + " " + t.LastName,
			})
		}

		unitStatus := UnitRentStatus{
			LeaseID: lease.ID,
			Property: PropertyInfo{
				ID:      unit.Property.ID,
				Address: unit.Property.AddressStreet + ", " + unit.Property.AddressCity,
			},
			Unit: UnitInfo{
				ID:   unit.ID,
				Name: unit.Name,
			},
			Tenants:     tenants,
			AmountDue:   lease.MonthlyRent,
			TotalPaid:   totalPaid,
			Balance:     lease.MonthlyRent - totalPaid,
			Status:      status,
			DueDate:     dueDate.Format("2006-01-02"),
			DaysOverdue: daysOverdue,
			Payments:    paymentInfos,
		}

		unitStatuses = append(unitStatuses, unitStatus)
		summary.TotalExpected += lease.MonthlyRent
		summary.TotalReceived += totalPaid
	}

	summary.TotalOutstanding = summary.TotalExpected - summary.TotalReceived

	return c.JSON(http.StatusOK, RentStatusResponse{
		Period: PeriodInfo{
			Start: periodStart,
			End:   periodEnd,
		},
		Summary: summary,
		Units:   unitStatuses,
	})
}

func ListPayments(c echo.Context) error {
	leaseID := c.QueryParam("leaseId")
	startDate := c.QueryParam("startDate")
	endDate := c.QueryParam("endDate")

	var payments []models.RentPayment
	query := db.DB.Order("payment_date DESC")

	if leaseID != "" {
		query = query.Where("lease_id = ?", leaseID)
	}
	if startDate != "" {
		query = query.Where("payment_date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("payment_date <= ?", endDate)
	}

	result := query.Limit(50).Find(&payments)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch payments"})
	}

	return c.JSON(http.StatusOK, payments)
}

func CreatePayment(c echo.Context) error {
	var req CreatePaymentRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
	}

	// Verify lease exists
	var lease models.Lease
	if err := db.DB.First(&lease, "id = ?", req.LeaseID).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Lease not found"})
	}

	payment := models.RentPayment{
		LeaseID:         req.LeaseID,
		Amount:          req.Amount,
		LateFeeAmount:   req.LateFeeAmount,
		PaymentDate:     req.PaymentDate,
		PeriodStart:     req.PeriodStart,
		PeriodEnd:       req.PeriodEnd,
		Method:          models.PaymentMethod(req.Method),
		CheckNumber:     req.CheckNumber,
		ReferenceNumber: req.ReferenceNumber,
		Notes:           req.Notes,
	}

	result := db.DB.Create(&payment)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create payment"})
	}

	return c.JSON(http.StatusCreated, payment)
}

func DeletePayment(c echo.Context) error {
	id := c.Param("id")

	result := db.DB.Delete(&models.RentPayment{}, "id = ?", id)
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Payment not found"})
	}

	return c.JSON(http.StatusOK, map[string]string{"success": "true"})
}
