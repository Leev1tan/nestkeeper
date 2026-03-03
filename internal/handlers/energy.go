package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"nestkeeper/internal/db"
	"nestkeeper/internal/models"
)

type CreateEnergyReadingRequest struct {
	PropertyID        string  `json:"propertyId"`
	ReadingDate       string  `json:"readingDate"`
	GridImportKwh     float64 `json:"gridImportKwh"`
	SolarGeneratedKwh float64 `json:"solarGeneratedKwh"`
	GridExportKwh     float64 `json:"gridExportKwh"`
	GridPricePerKwh   float64 `json:"gridPricePerKwh"`
	Notes             *string `json:"notes"`
}

type EnergyReadingResponse struct {
	models.EnergyReading
	SolarSavings    float64 `json:"solarSavings"`
	GridCost        float64 `json:"gridCost"`
	ExportEarnings  float64 `json:"exportEarnings"`
}

func toEnergyResponse(r models.EnergyReading) EnergyReadingResponse {
	return EnergyReadingResponse{
		EnergyReading:  r,
		SolarSavings:   r.SolarSavings(),
		GridCost:       r.GridCost(),
		ExportEarnings: r.ExportEarnings(),
	}
}

func ListEnergyReadings(c echo.Context) error {
	propertyID := c.QueryParam("propertyId")
	year := c.QueryParam("year")

	query := db.DB.Order("reading_date DESC")

	if propertyID != "" {
		query = query.Where("property_id = ?", propertyID)
	}
	if year != "" {
		query = query.Where("reading_date LIKE ?", year+"%")
	}

	var readings []models.EnergyReading
	if err := query.Find(&readings).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch readings"})
	}

	result := make([]EnergyReadingResponse, len(readings))
	for i, r := range readings {
		result[i] = toEnergyResponse(r)
	}

	return c.JSON(http.StatusOK, result)
}

func CreateEnergyReading(c echo.Context) error {
	var req CreateEnergyReadingRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	if req.PropertyID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Property is required"})
	}
	if req.ReadingDate == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Reading date is required"})
	}
	if req.GridPricePerKwh <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Grid price must be greater than 0"})
	}

	reading := models.EnergyReading{
		PropertyID:        req.PropertyID,
		ReadingDate:       req.ReadingDate,
		GridImportKwh:     req.GridImportKwh,
		SolarGeneratedKwh: req.SolarGeneratedKwh,
		GridExportKwh:     req.GridExportKwh,
		GridPricePerKwh:   req.GridPricePerKwh,
		Notes:             req.Notes,
	}

	if err := db.DB.Create(&reading).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create reading"})
	}

	return c.JSON(http.StatusCreated, toEnergyResponse(reading))
}

func DeleteEnergyReading(c echo.Context) error {
	id := c.Param("id")

	var reading models.EnergyReading
	if err := db.DB.First(&reading, "id = ?", id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Reading not found"})
	}

	if err := db.DB.Delete(&reading).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to delete reading"})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Deleted"})
}
