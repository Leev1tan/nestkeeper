package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"nestkeeper/internal/db"
	"nestkeeper/internal/models"
)

type CreateTenantRequest struct {
	FirstName                   string  `json:"firstName" validate:"required"`
	LastName                    string  `json:"lastName" validate:"required"`
	Email                       *string `json:"email"`
	Phone                       string  `json:"phone" validate:"required"`
	EmergencyContactName        *string `json:"emergencyContactName"`
	EmergencyContactPhone       *string `json:"emergencyContactPhone"`
	EmergencyContactRelationship *string `json:"emergencyContactRelationship"`
	Notes                       *string `json:"notes"`
}

func ListTenants(c echo.Context) error {
	var tenants []models.Tenant
	result := db.DB.Find(&tenants)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch tenants"})
	}
	return c.JSON(http.StatusOK, tenants)
}

func CreateTenant(c echo.Context) error {
	var req CreateTenantRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
	}

	tenant := models.Tenant{
		FirstName:                   req.FirstName,
		LastName:                    req.LastName,
		Email:                       req.Email,
		Phone:                       req.Phone,
		EmergencyContactName:        req.EmergencyContactName,
		EmergencyContactPhone:       req.EmergencyContactPhone,
		EmergencyContactRelationship: req.EmergencyContactRelationship,
		Notes:                       req.Notes,
	}

	result := db.DB.Create(&tenant)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create tenant"})
	}

	return c.JSON(http.StatusCreated, tenant)
}

func GetTenant(c echo.Context) error {
	id := c.Param("id")

	var tenant models.Tenant
	result := db.DB.First(&tenant, "id = ?", id)
	if result.Error != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Tenant not found"})
	}

	return c.JSON(http.StatusOK, tenant)
}

func UpdateTenant(c echo.Context) error {
	id := c.Param("id")

	var tenant models.Tenant
	if err := db.DB.First(&tenant, "id = ?", id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Tenant not found"})
	}

	var req CreateTenantRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
	}

	db.DB.Model(&tenant).Updates(models.Tenant{
		FirstName:                   req.FirstName,
		LastName:                    req.LastName,
		Email:                       req.Email,
		Phone:                       req.Phone,
		EmergencyContactName:        req.EmergencyContactName,
		EmergencyContactPhone:       req.EmergencyContactPhone,
		EmergencyContactRelationship: req.EmergencyContactRelationship,
		Notes:                       req.Notes,
	})

	return c.JSON(http.StatusOK, tenant)
}

func DeleteTenant(c echo.Context) error {
	id := c.Param("id")

	result := db.DB.Delete(&models.Tenant{}, "id = ?", id)
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Tenant not found"})
	}

	return c.JSON(http.StatusOK, map[string]string{"success": "true"})
}
