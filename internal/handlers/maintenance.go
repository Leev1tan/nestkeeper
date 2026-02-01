package handlers

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"nestkeeper/internal/db"
	"nestkeeper/internal/models"
)

var MaintenanceTemplates = []map[string]interface{}{
	{
		"id":            "smoke-detector",
		"name":          "Smoke/CO Detector Check",
		"frequency":     "every_6_months",
		"description":   "Test all smoke and CO detectors, replace batteries",
		"category":      "safety",
		"estimatedCost": 20,
		"requiredByLaw": true,
		"reminderDays":  "[7, 3, 1, 0, -3, -7]",
	},
	{
		"id":            "hvac-filter",
		"name":          "HVAC Filter Change",
		"frequency":     "quarterly",
		"description":   "Replace HVAC air filters",
		"category":      "hvac",
		"estimatedCost": 30,
		"requiredByLaw": false,
		"reminderDays":  "[7, 1, 0]",
	},
	{
		"id":            "hvac-service",
		"name":          "HVAC Professional Service",
		"frequency":     "annually",
		"description":   "Annual HVAC inspection and tune-up",
		"category":      "hvac",
		"estimatedCost": 150,
		"requiredByLaw": false,
		"reminderDays":  "[14, 7, 1, 0]",
	},
	{
		"id":            "pest-control",
		"name":          "Pest Control Treatment",
		"frequency":     "quarterly",
		"description":   "Professional pest control treatment",
		"category":      "pest_control",
		"estimatedCost": 100,
		"requiredByLaw": false,
		"reminderDays":  "[7, 1, 0]",
	},
	{
		"id":            "gutter-cleaning",
		"name":          "Gutter Cleaning",
		"frequency":     "every_6_months",
		"description":   "Clean gutters and downspouts",
		"category":      "exterior",
		"estimatedCost": 150,
		"requiredByLaw": false,
		"reminderDays":  "[14, 7, 0]",
	},
	{
		"id":            "water-heater-flush",
		"name":          "Water Heater Flush",
		"frequency":     "annually",
		"description":   "Drain and flush water heater to remove sediment",
		"category":      "plumbing",
		"estimatedCost": 0,
		"requiredByLaw": false,
		"reminderDays":  "[14, 7, 0]",
	},
	{
		"id":            "dryer-vent",
		"name":          "Dryer Vent Cleaning",
		"frequency":     "annually",
		"description":   "Clean dryer vent to prevent fire hazard",
		"category":      "safety",
		"estimatedCost": 100,
		"requiredByLaw": true,
		"reminderDays":  "[14, 7, 1, 0, -7]",
	},
	{
		"id":            "fire-extinguisher",
		"name":          "Fire Extinguisher Check",
		"frequency":     "annually",
		"description":   "Inspect fire extinguisher, replace if needed",
		"category":      "safety",
		"estimatedCost": 50,
		"requiredByLaw": true,
		"reminderDays":  "[30, 14, 7, 0]",
	},
}

type CreateMaintenanceRequest struct {
	PropertyID          *string  `json:"propertyId"`
	UnitID              *string  `json:"unitId"`
	TemplateID          *string  `json:"templateId"`
	Name                string   `json:"name" validate:"required"`
	Description         *string  `json:"description"`
	Category            string   `json:"category" validate:"required"`
	Frequency           string   `json:"frequency" validate:"required"`
	CustomFrequencyDays *int     `json:"customFrequencyDays"`
	DueDate             string   `json:"dueDate" validate:"required"`
	ReminderDays        *string  `json:"reminderDays"`
	EstimatedCost       *float64 `json:"estimatedCost"`
	Vendor              *string  `json:"vendor"`
	RequiredByLaw       bool     `json:"requiredByLaw"`
}

type CompleteTaskRequest struct {
	CompletedNotes *string  `json:"completedNotes"`
	ActualCost     *float64 `json:"actualCost"`
	Vendor         *string  `json:"vendor"`
	CreateExpense  bool     `json:"createExpense"`
}

func GetMaintenanceTemplates(c echo.Context) error {
	return c.JSON(http.StatusOK, MaintenanceTemplates)
}

func ListMaintenanceTasks(c echo.Context) error {
	status := c.QueryParam("status")
	propertyID := c.QueryParam("propertyId")

	today := time.Now().Format("2006-01-02")

	// Update overdue statuses
	db.DB.Model(&models.MaintenanceTask{}).
		Where("status = ? AND due_date <= ?", "pending", today).
		Update("status", "overdue")

	var tasks []models.MaintenanceTask
	query := db.DB.Order("due_date ASC")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if propertyID != "" {
		query = query.Where("property_id = ?", propertyID)
	}

	result := query.Find(&tasks)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to fetch tasks"})
	}

	return c.JSON(http.StatusOK, tasks)
}

func GetOverdueTasks(c echo.Context) error {
	today := time.Now().Format("2006-01-02")

	var tasks []models.MaintenanceTask
	db.DB.Where("status = ? OR (status = ? AND due_date <= ?)", "overdue", "pending", today).
		Order("due_date ASC").
		Find(&tasks)

	return c.JSON(http.StatusOK, tasks)
}

func GetUpcomingTasks(c echo.Context) error {
	today := time.Now()
	thirtyDaysLater := today.AddDate(0, 0, 30).Format("2006-01-02")
	todayStr := today.Format("2006-01-02")

	var tasks []models.MaintenanceTask
	db.DB.Where("status = ? AND due_date >= ? AND due_date <= ?", "pending", todayStr, thirtyDaysLater).
		Order("due_date ASC").
		Find(&tasks)

	return c.JSON(http.StatusOK, tasks)
}

func CreateMaintenanceTask(c echo.Context) error {
	var req CreateMaintenanceRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
	}

	reminderDays := "[7, 1, 0]"
	if req.ReminderDays != nil {
		reminderDays = *req.ReminderDays
	}

	task := models.MaintenanceTask{
		PropertyID:          req.PropertyID,
		UnitID:              req.UnitID,
		TemplateID:          req.TemplateID,
		Name:                req.Name,
		Description:         req.Description,
		Category:            models.MaintenanceCategory(req.Category),
		Frequency:           models.MaintenanceFrequency(req.Frequency),
		CustomFrequencyDays: req.CustomFrequencyDays,
		DueDate:             req.DueDate,
		ReminderDays:        &reminderDays,
		Status:              models.MaintenanceStatusPending,
		EstimatedCost:       req.EstimatedCost,
		Vendor:              req.Vendor,
		RequiredByLaw:       req.RequiredByLaw,
	}

	result := db.DB.Create(&task)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create task"})
	}

	return c.JSON(http.StatusCreated, task)
}

func GetMaintenanceTask(c echo.Context) error {
	id := c.Param("id")

	var task models.MaintenanceTask
	result := db.DB.First(&task, "id = ?", id)
	if result.Error != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Task not found"})
	}

	return c.JSON(http.StatusOK, task)
}

func UpdateMaintenanceTask(c echo.Context) error {
	id := c.Param("id")

	var task models.MaintenanceTask
	if err := db.DB.First(&task, "id = ?", id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Task not found"})
	}

	var req CreateMaintenanceRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
	}

	db.DB.Model(&task).Updates(map[string]interface{}{
		"name":                 req.Name,
		"description":          req.Description,
		"category":             models.MaintenanceCategory(req.Category),
		"frequency":            models.MaintenanceFrequency(req.Frequency),
		"custom_frequency_days": req.CustomFrequencyDays,
		"due_date":             req.DueDate,
		"reminder_days":        req.ReminderDays,
		"estimated_cost":       req.EstimatedCost,
		"vendor":               req.Vendor,
		"required_by_law":      req.RequiredByLaw,
	})

	return c.JSON(http.StatusOK, task)
}

func CompleteMaintenanceTask(c echo.Context) error {
	id := c.Param("id")

	var task models.MaintenanceTask
	if err := db.DB.First(&task, "id = ?", id).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Task not found"})
	}

	var req CompleteTaskRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
	}

	completedDate := time.Now().Format("2006-01-02")

	// Update task
	db.DB.Model(&task).Updates(map[string]interface{}{
		"status":          models.MaintenanceStatusCompleted,
		"completed_date":  completedDate,
		"completed_notes": req.CompletedNotes,
		"actual_cost":     req.ActualCost,
		"vendor":          req.Vendor,
	})

	// Create expense if requested
	var expense *models.Expense
	if req.CreateExpense && req.ActualCost != nil && *req.ActualCost > 0 {
		description := "Maintenance: " + task.Name
		expense = &models.Expense{
			PropertyID:    task.PropertyID,
			UnitID:        task.UnitID,
			Amount:        *req.ActualCost,
			Date:          completedDate,
			Category:      models.ExpenseCategoryRepairs,
			Vendor:        req.Vendor,
			Description:   &description,
			TaxDeductible: true,
		}
		db.DB.Create(expense)

		// Link expense to task
		db.DB.Model(&task).Update("linked_expense_id", expense.ID)
	}

	// Create next recurring task if applicable
	nextTaskCreated := false
	if task.Frequency != models.MaintenanceFrequencyOneTime {
		nextDueDate := calculateNextDueDate(completedDate, task.Frequency, task.CustomFrequencyDays)
		nextTask := models.MaintenanceTask{
			PropertyID:          task.PropertyID,
			UnitID:              task.UnitID,
			TemplateID:          task.TemplateID,
			Name:                task.Name,
			Description:         task.Description,
			Category:            task.Category,
			Frequency:           task.Frequency,
			CustomFrequencyDays: task.CustomFrequencyDays,
			DueDate:             nextDueDate,
			ReminderDays:        task.ReminderDays,
			Status:              models.MaintenanceStatusPending,
			EstimatedCost:       task.EstimatedCost,
			Vendor:              task.Vendor,
			RequiredByLaw:       task.RequiredByLaw,
		}
		db.DB.Create(&nextTask)
		nextTaskCreated = true
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"task":            task,
		"expense":         expense,
		"nextTaskCreated": nextTaskCreated,
	})
}

func DeleteMaintenanceTask(c echo.Context) error {
	id := c.Param("id")

	result := db.DB.Delete(&models.MaintenanceTask{}, "id = ?", id)
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Task not found"})
	}

	return c.JSON(http.StatusOK, map[string]string{"success": "true"})
}

func calculateNextDueDate(fromDate string, frequency models.MaintenanceFrequency, customDays *int) string {
	date, _ := time.Parse("2006-01-02", fromDate)

	switch frequency {
	case models.MaintenanceFrequencyMonthly:
		date = date.AddDate(0, 1, 0)
	case models.MaintenanceFrequencyQuarterly:
		date = date.AddDate(0, 3, 0)
	case models.MaintenanceFrequencyEvery6Months:
		date = date.AddDate(0, 6, 0)
	case models.MaintenanceFrequencyAnnually:
		date = date.AddDate(1, 0, 0)
	case models.MaintenanceFrequencyCustom:
		if customDays != nil {
			date = date.AddDate(0, 0, *customDays)
		}
	}

	return date.Format("2006-01-02")
}
