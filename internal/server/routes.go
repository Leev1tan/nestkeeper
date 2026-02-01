package server

import (
	"github.com/labstack/echo/v4"
	"nestkeeper/internal/handlers"
	"nestkeeper/internal/middleware"
)

func RegisterRoutes(e *echo.Echo) {
	api := e.Group("/api")

	// Health check (public)
	api.GET("/health", handlers.HealthCheck)

	// Auth routes (public)
	auth := api.Group("/auth")
	auth.POST("/register", handlers.Register)
	auth.POST("/login", handlers.Login)
	auth.POST("/logout", handlers.Logout)
	auth.GET("/me", handlers.GetCurrentUser, middleware.RequireAuth)
	auth.GET("/setup", handlers.CheckSetup)

	// Protected routes - require authentication
	protected := api.Group("")
	protected.Use(middleware.RequireAuth)

	// Properties
	properties := protected.Group("/properties")
	properties.GET("", handlers.ListProperties)
	properties.POST("", handlers.CreateProperty)
	properties.GET("/:id", handlers.GetProperty)
	properties.PUT("/:id", handlers.UpdateProperty)
	properties.DELETE("/:id", handlers.DeleteProperty)

	// Units
	units := protected.Group("/units")
	units.GET("", handlers.ListUnits)
	units.POST("", handlers.CreateUnit)
	units.GET("/:id", handlers.GetUnit)
	units.PUT("/:id", handlers.UpdateUnit)
	units.DELETE("/:id", handlers.DeleteUnit)

	// Tenants
	tenants := protected.Group("/tenants")
	tenants.GET("", handlers.ListTenants)
	tenants.POST("", handlers.CreateTenant)
	tenants.GET("/:id", handlers.GetTenant)
	tenants.PUT("/:id", handlers.UpdateTenant)
	tenants.DELETE("/:id", handlers.DeleteTenant)

	// Leases
	leases := protected.Group("/leases")
	leases.GET("", handlers.ListLeases)
	leases.POST("", handlers.CreateLease)
	leases.GET("/:id", handlers.GetLease)
	leases.PUT("/:id", handlers.UpdateLease)
	leases.DELETE("/:id", handlers.DeleteLease)

	// Rent
	rent := protected.Group("/rent")
	rent.GET("/status", handlers.GetRentStatus)
	rent.GET("/payments", handlers.ListPayments)
	rent.POST("/payments", handlers.CreatePayment)
	rent.DELETE("/payments/:id", handlers.DeletePayment)

	// Expenses
	expenses := protected.Group("/expenses")
	expenses.GET("", handlers.ListExpenses)
	expenses.POST("", handlers.CreateExpense)
	expenses.GET("/:id", handlers.GetExpense)
	expenses.PUT("/:id", handlers.UpdateExpense)
	expenses.DELETE("/:id", handlers.DeleteExpense)

	// Maintenance
	maintenance := protected.Group("/maintenance")
	maintenance.GET("", handlers.ListMaintenanceTasks)
	maintenance.POST("", handlers.CreateMaintenanceTask)
	maintenance.GET("/templates", handlers.GetMaintenanceTemplates)
	maintenance.GET("/overdue", handlers.GetOverdueTasks)
	maintenance.GET("/upcoming", handlers.GetUpcomingTasks)
	maintenance.GET("/:id", handlers.GetMaintenanceTask)
	maintenance.PUT("/:id", handlers.UpdateMaintenanceTask)
	maintenance.POST("/:id/complete", handlers.CompleteMaintenanceTask)
	maintenance.DELETE("/:id", handlers.DeleteMaintenanceTask)

	// Documents
	documents := protected.Group("/documents")
	documents.GET("", handlers.ListDocuments)
	documents.POST("", handlers.UploadDocument)
	documents.GET("/:id", handlers.GetDocument)
	documents.DELETE("/:id", handlers.DeleteDocument)

	// Reports
	reports := protected.Group("/reports")
	reports.GET("/tax/:year", handlers.GetTaxReport)
	reports.GET("/cash-flow", handlers.GetCashFlowReport)

	// Billing (protected)
	billing := protected.Group("/billing")
	billing.GET("/status", handlers.GetSubscriptionStatus)
	billing.POST("/checkout", handlers.CreateCheckoutSession)
	billing.POST("/portal", handlers.CreatePortalSession)

	// Stripe webhook (public - Stripe needs to call this)
	api.POST("/billing/webhook", handlers.HandleWebhook)
}
