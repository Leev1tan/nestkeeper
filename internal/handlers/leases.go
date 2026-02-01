package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"nestkeeper/internal/db"
	"nestkeeper/internal/models"
)

type CreateLeaseRequest struct {
	UnitID              string   `json:"unitId" validate:"required,uuid"`
	TenantIDs           []string `json:"tenantIds" validate:"required,min=1"`
	PrimaryTenantID     string   `json:"primaryTenantId" validate:"required,uuid"`
	StartDate           string   `json:"startDate" validate:"required"`
	EndDate             string   `json:"endDate" validate:"required"`
	MonthlyRent         float64  `json:"monthlyRent" validate:"required"`
	SecurityDeposit     float64  `json:"securityDeposit" validate:"required"`
	RentDueDay          int      `json:"rentDueDay"`
	LateFeeAmount       *float64 `json:"lateFeeAmount"`
	LateFeeGraceDays    *int     `json:"lateFeeGraceDays"`
	RenewalReminderDays *int     `json:"renewalReminderDays"`
}

func ListLeases(c echo.Context) error {
	unitID := c.QueryParam("unitId")
	status := c.QueryParam("status")

	var leases []models.Lease
	query := db.DB.Preload("Tenants")

	if unitID != "" {
		query = query.Where("unit_id = ?", unitID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	result := query.Find(&leases)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch leases"})
	}
	return c.JSON(http.StatusOK, leases)
}

func CreateLease(c echo.Context) error {
	var req CreateLeaseRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
	}

	rentDueDay := 1
	if req.RentDueDay > 0 {
		rentDueDay = req.RentDueDay
	}

	lateFeeGraceDays := 5
	if req.LateFeeGraceDays != nil {
		lateFeeGraceDays = *req.LateFeeGraceDays
	}

	renewalReminderDays := 60
	if req.RenewalReminderDays != nil {
		renewalReminderDays = *req.RenewalReminderDays
	}

	lease := models.Lease{
		UnitID:              req.UnitID,
		StartDate:           req.StartDate,
		EndDate:             req.EndDate,
		MonthlyRent:         req.MonthlyRent,
		SecurityDeposit:     req.SecurityDeposit,
		RentDueDay:          rentDueDay,
		LateFeeAmount:       req.LateFeeAmount,
		LateFeeGraceDays:    lateFeeGraceDays,
		Status:              "active",
		RenewalReminderDays: renewalReminderDays,
	}

	tx := db.DB.Begin()

	if err := tx.Create(&lease).Error; err != nil {
		tx.Rollback()
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create lease"})
	}

	// Create lease-tenant associations
	for _, tenantID := range req.TenantIDs {
		leaseTenant := models.LeaseTenant{
			LeaseID:   lease.ID,
			TenantID:  tenantID,
			IsPrimary: tenantID == req.PrimaryTenantID,
		}
		if err := tx.Create(&leaseTenant).Error; err != nil {
			tx.Rollback()
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to associate tenants"})
		}
	}

	// Update unit status to occupied
	tx.Model(&models.Unit{}).Where("id = ?", req.UnitID).Update("status", "occupied")

	tx.Commit()

	// Reload with associations
	db.DB.Preload("Tenants").First(&lease, "id = ?", lease.ID)

	return c.JSON(http.StatusCreated, lease)
}

func GetLease(c echo.Context) error {
	id := c.Param("id")

	var lease models.Lease
	result := db.DB.Preload("Tenants").First(&lease, "id = ?", id)
	if result.Error != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Lease not found"})
	}

	return c.JSON(http.StatusOK, lease)
}

func UpdateLease(c echo.Context) error {
	id := c.Param("id")

	var lease models.Lease
	if err := db.DB.First(&lease, "id = ?", id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Lease not found"})
	}

	var req CreateLeaseRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
	}

	updates := map[string]interface{}{
		"start_date":       req.StartDate,
		"end_date":         req.EndDate,
		"monthly_rent":     req.MonthlyRent,
		"security_deposit": req.SecurityDeposit,
		"rent_due_day":     req.RentDueDay,
		"late_fee_amount":  req.LateFeeAmount,
	}
	if req.LateFeeGraceDays != nil {
		updates["late_fee_grace_days"] = *req.LateFeeGraceDays
	}
	if req.RenewalReminderDays != nil {
		updates["renewal_reminder_days"] = *req.RenewalReminderDays
	}

	db.DB.Model(&lease).Updates(updates)

	return c.JSON(http.StatusOK, lease)
}

func DeleteLease(c echo.Context) error {
	id := c.Param("id")

	var lease models.Lease
	if err := db.DB.First(&lease, "id = ?", id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Lease not found"})
	}

	// Update unit status back to vacant
	db.DB.Model(&models.Unit{}).Where("id = ?", lease.UnitID).Update("status", "vacant")

	result := db.DB.Delete(&lease)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to delete lease"})
	}

	return c.JSON(http.StatusOK, map[string]string{"success": "true"})
}
