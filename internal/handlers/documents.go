package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"nestkeeper/internal/db"
	"nestkeeper/internal/models"
)

type CreateDocumentRequest struct {
	Name           string  `json:"name" validate:"required"`
	Type           string  `json:"type" validate:"required"`
	FilePath       string  `json:"filePath" validate:"required"`
	FileSize       *int64  `json:"fileSize"`
	MimeType       *string `json:"mimeType"`
	PropertyID     *string `json:"propertyId"`
	UnitID         *string `json:"unitId"`
	TenantID       *string `json:"tenantId"`
	ExpenseID      *string `json:"expenseId"`
	Tags           *string `json:"tags"`
	ExpirationDate *string `json:"expirationDate"`
}

func ListDocuments(c echo.Context) error {
	propertyID := c.QueryParam("propertyId")
	docType := c.QueryParam("type")
	tenantID := c.QueryParam("tenantId")

	var documents []models.Document
	query := db.DB.Order("uploaded_at DESC")

	if propertyID != "" {
		query = query.Where("property_id = ?", propertyID)
	}
	if docType != "" {
		query = query.Where("type = ?", docType)
	}
	if tenantID != "" {
		query = query.Where("tenant_id = ?", tenantID)
	}

	result := query.Find(&documents)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch documents"})
	}

	return c.JSON(http.StatusOK, documents)
}

func UploadDocument(c echo.Context) error {
	var req CreateDocumentRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
	}

	document := models.Document{
		Name:           req.Name,
		Type:           models.DocumentType(req.Type),
		FilePath:       req.FilePath,
		FileSize:       req.FileSize,
		MimeType:       req.MimeType,
		PropertyID:     req.PropertyID,
		UnitID:         req.UnitID,
		TenantID:       req.TenantID,
		ExpenseID:      req.ExpenseID,
		Tags:           req.Tags,
		ExpirationDate: req.ExpirationDate,
		Encrypted:      false,
	}

	result := db.DB.Create(&document)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create document"})
	}

	return c.JSON(http.StatusCreated, document)
}

func GetDocument(c echo.Context) error {
	id := c.Param("id")

	var document models.Document
	result := db.DB.First(&document, "id = ?", id)
	if result.Error != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Document not found"})
	}

	return c.JSON(http.StatusOK, document)
}

func DeleteDocument(c echo.Context) error {
	id := c.Param("id")

	result := db.DB.Delete(&models.Document{}, "id = ?", id)
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Document not found"})
	}

	return c.JSON(http.StatusOK, map[string]string{"success": "true"})
}
