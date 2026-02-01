package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"nestkeeper/internal/db"
	"nestkeeper/internal/models"
)

type CreatePropertyRequest struct {
	AddressStreet  string  `json:"addressStreet" validate:"required"`
	AddressCity    string  `json:"addressCity" validate:"required"`
	AddressState   string  `json:"addressState" validate:"required,len=2"`
	AddressZip     string  `json:"addressZip" validate:"required,min=5"`
	AddressCountry string  `json:"addressCountry"`
	PropertyType   string  `json:"propertyType" validate:"required,oneof=single_family multi_family condo townhouse"`
	PurchaseDate   *string `json:"purchaseDate"`
	PurchasePrice  *float64 `json:"purchasePrice"`
	CurrentValue   *float64 `json:"currentValue"`
	Notes          *string `json:"notes"`
}

func ListProperties(c echo.Context) error {
	var properties []models.Property
	result := db.DB.Find(&properties)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch properties"})
	}
	return c.JSON(http.StatusOK, properties)
}

func CreateProperty(c echo.Context) error {
	var req CreatePropertyRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
	}

	country := "USA"
	if req.AddressCountry != "" {
		country = req.AddressCountry
	}

	property := models.Property{
		AddressStreet:  req.AddressStreet,
		AddressCity:    req.AddressCity,
		AddressState:   req.AddressState,
		AddressZip:     req.AddressZip,
		AddressCountry: country,
		PropertyType:   models.PropertyType(req.PropertyType),
		PurchaseDate:   req.PurchaseDate,
		PurchasePrice:  req.PurchasePrice,
		CurrentValue:   req.CurrentValue,
		Notes:          req.Notes,
	}

	result := db.DB.Create(&property)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create property"})
	}

	// Auto-create a unit for single family homes
	if req.PropertyType == "single_family" {
		unit := models.Unit{
			PropertyID:  property.ID,
			Name:        "Main House",
			MonthlyRent: 0,
			Status:      models.UnitStatusVacant,
		}
		db.DB.Create(&unit)
	}

	return c.JSON(http.StatusCreated, property)
}

func GetProperty(c echo.Context) error {
	id := c.Param("id")

	var property models.Property
	result := db.DB.Preload("Units").First(&property, "id = ?", id)
	if result.Error != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Property not found"})
	}

	return c.JSON(http.StatusOK, property)
}

func UpdateProperty(c echo.Context) error {
	id := c.Param("id")

	var property models.Property
	if err := db.DB.First(&property, "id = ?", id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Property not found"})
	}

	var req CreatePropertyRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
	}

	updates := map[string]interface{}{
		"address_street": req.AddressStreet,
		"address_city":   req.AddressCity,
		"address_state":  req.AddressState,
		"address_zip":    req.AddressZip,
		"property_type":  req.PropertyType,
	}

	if req.AddressCountry != "" {
		updates["address_country"] = req.AddressCountry
	}
	if req.PurchaseDate != nil {
		updates["purchase_date"] = req.PurchaseDate
	}
	if req.PurchasePrice != nil {
		updates["purchase_price"] = req.PurchasePrice
	}
	if req.CurrentValue != nil {
		updates["current_value"] = req.CurrentValue
	}
	if req.Notes != nil {
		updates["notes"] = req.Notes
	}

	db.DB.Model(&property).Updates(updates)

	return c.JSON(http.StatusOK, property)
}

func DeleteProperty(c echo.Context) error {
	id := c.Param("id")

	result := db.DB.Delete(&models.Property{}, "id = ?", id)
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Property not found"})
	}

	return c.JSON(http.StatusOK, map[string]string{"success": "true"})
}
