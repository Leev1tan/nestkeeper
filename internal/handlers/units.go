package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"nestkeeper/internal/db"
	"nestkeeper/internal/models"
)

type CreateUnitRequest struct {
	PropertyID      string   `json:"propertyId" validate:"required,uuid"`
	Name            string   `json:"name" validate:"required"`
	Bedrooms        *int     `json:"bedrooms"`
	Bathrooms       *float64 `json:"bathrooms"`
	SquareFeet      *int     `json:"squareFeet"`
	MonthlyRent     float64  `json:"monthlyRent" validate:"required"`
	SecurityDeposit *float64 `json:"securityDeposit"`
	Status          string   `json:"status"`
}

func ListUnits(c echo.Context) error {
	propertyID := c.QueryParam("propertyId")

	var units []models.Unit
	query := db.DB
	if propertyID != "" {
		query = query.Where("property_id = ?", propertyID)
	}

	result := query.Find(&units)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch units"})
	}
	return c.JSON(http.StatusOK, units)
}

func CreateUnit(c echo.Context) error {
	var req CreateUnitRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
	}

	status := models.UnitStatusVacant
	if req.Status != "" {
		status = models.UnitStatus(req.Status)
	}

	bedrooms := 0
	if req.Bedrooms != nil {
		bedrooms = *req.Bedrooms
	}

	bathrooms := 0.0
	if req.Bathrooms != nil {
		bathrooms = *req.Bathrooms
	}

	unit := models.Unit{
		PropertyID:      req.PropertyID,
		Name:            req.Name,
		Bedrooms:        bedrooms,
		Bathrooms:       bathrooms,
		SquareFeet:      req.SquareFeet,
		MonthlyRent:     req.MonthlyRent,
		SecurityDeposit: req.SecurityDeposit,
		Status:          status,
	}

	result := db.DB.Create(&unit)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create unit"})
	}

	return c.JSON(http.StatusCreated, unit)
}

func GetUnit(c echo.Context) error {
	id := c.Param("id")

	var unit models.Unit
	result := db.DB.Preload("Appliances").First(&unit, "id = ?", id)
	if result.Error != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Unit not found"})
	}

	return c.JSON(http.StatusOK, unit)
}

func UpdateUnit(c echo.Context) error {
	id := c.Param("id")

	var unit models.Unit
	if err := db.DB.First(&unit, "id = ?", id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Unit not found"})
	}

	var req CreateUnitRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
	}

	updates := map[string]interface{}{
		"name":         req.Name,
		"monthly_rent": req.MonthlyRent,
	}
	if req.Bedrooms != nil {
		updates["bedrooms"] = *req.Bedrooms
	}
	if req.Bathrooms != nil {
		updates["bathrooms"] = *req.Bathrooms
	}
	if req.SquareFeet != nil {
		updates["square_feet"] = req.SquareFeet
	}
	if req.SecurityDeposit != nil {
		updates["security_deposit"] = req.SecurityDeposit
	}
	if req.Status != "" {
		updates["status"] = models.UnitStatus(req.Status)
	}

	db.DB.Model(&unit).Updates(updates)

	return c.JSON(http.StatusOK, unit)
}

func DeleteUnit(c echo.Context) error {
	id := c.Param("id")

	result := db.DB.Delete(&models.Unit{}, "id = ?", id)
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Unit not found"})
	}

	return c.JSON(http.StatusOK, map[string]string{"success": "true"})
}
