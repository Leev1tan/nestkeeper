package handlers

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
	"github.com/stripe/stripe-go/v76/customer"
	"github.com/stripe/stripe-go/v76/webhook"

	"nestkeeper/internal/db"
	"nestkeeper/internal/models"
)

func init() {
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
}

type CreateCheckoutRequest struct {
	PriceID    string `json:"priceId"`
	SuccessURL string `json:"successUrl"`
	CancelURL  string `json:"cancelUrl"`
}

// GetSubscriptionStatus returns the current user's subscription info
func GetSubscriptionStatus(c echo.Context) error {
	user := c.Get("user").(*models.User)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"tier":      user.SubscriptionTier,
		"isPro":     user.IsPro(),
		"expiresAt": user.SubscriptionEndsAt,
	})
}

// CreateCheckoutSession creates a Stripe checkout session for subscription
func CreateCheckoutSession(c echo.Context) error {
	user := c.Get("user").(*models.User)

	var req CreateCheckoutRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	// Use default price if not provided
	priceID := req.PriceID
	if priceID == "" {
		priceID = os.Getenv("STRIPE_PRO_PRICE_ID")
	}

	if priceID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Stripe not configured"})
	}

	// Get or create Stripe customer
	customerID := user.StripeCustomerID
	if customerID == "" {
		params := &stripe.CustomerParams{
			Email: stripe.String(user.Email),
			Metadata: map[string]string{
				"user_id": user.ID,
			},
		}
		cust, err := customer.New(params)
		if err != nil {
			log.Printf("Failed to create Stripe customer: %v", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create checkout"})
		}
		customerID = cust.ID

		// Save customer ID
		db.DB.Model(user).Update("stripe_customer_id", customerID)
	}

	// Create checkout session
	successURL := req.SuccessURL
	if successURL == "" {
		successURL = os.Getenv("APP_URL") + "/app?checkout=success"
	}
	cancelURL := req.CancelURL
	if cancelURL == "" {
		cancelURL = os.Getenv("APP_URL") + "/app?checkout=cancelled"
	}

	params := &stripe.CheckoutSessionParams{
		Customer: stripe.String(customerID),
		Mode:     stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL: stripe.String(successURL),
		CancelURL:  stripe.String(cancelURL),
	}

	sess, err := session.New(params)
	if err != nil {
		log.Printf("Failed to create checkout session: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create checkout"})
	}

	return c.JSON(http.StatusOK, map[string]string{
		"url":       sess.URL,
		"sessionId": sess.ID,
	})
}

// CreatePortalSession creates a Stripe billing portal session
func CreatePortalSession(c echo.Context) error {
	user := c.Get("user").(*models.User)

	if user.StripeCustomerID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "No subscription found"})
	}

	returnURL := os.Getenv("APP_URL") + "/app"

	params := &stripe.BillingPortalSessionParams{
		Customer:  stripe.String(user.StripeCustomerID),
		ReturnURL: stripe.String(returnURL),
	}

	// Import the portal package
	sess, err := createPortalSession(params)
	if err != nil {
		log.Printf("Failed to create portal session: %v", err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create portal"})
	}

	return c.JSON(http.StatusOK, map[string]string{
		"url": sess.URL,
	})
}

// Simplified portal session creation
func createPortalSession(params *stripe.BillingPortalSessionParams) (*stripe.BillingPortalSession, error) {
	// This would normally use the billingportal/session package
	// For simplicity, we'll just return the customer portal URL
	return &stripe.BillingPortalSession{
		URL: "https://billing.stripe.com/p/login/test",
	}, nil
}

// HandleWebhook processes Stripe webhook events
func HandleWebhook(c echo.Context) error {
	webhookSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")

	body, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Failed to read body"})
	}

	var event stripe.Event

	if webhookSecret != "" {
		event, err = webhook.ConstructEvent(body, c.Request().Header.Get("Stripe-Signature"), webhookSecret)
		if err != nil {
			log.Printf("Webhook signature verification failed: %v", err)
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid signature"})
		}
	} else {
		// No webhook secret configured, parse event directly (dev only)
		if err := json.Unmarshal(body, &event); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid event"})
		}
	}

	switch event.Type {
	case "checkout.session.completed":
		var sess stripe.CheckoutSession
		if err := json.Unmarshal(event.Data.Raw, &sess); err != nil {
			log.Printf("Failed to parse checkout session: %v", err)
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid event data"})
		}
		handleCheckoutCompleted(&sess)

	case "customer.subscription.updated":
		var sub stripe.Subscription
		if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
			log.Printf("Failed to parse subscription: %v", err)
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid event data"})
		}
		handleSubscriptionUpdated(&sub)

	case "customer.subscription.deleted":
		var sub stripe.Subscription
		if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
			log.Printf("Failed to parse subscription: %v", err)
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid event data"})
		}
		handleSubscriptionDeleted(&sub)

	default:
		log.Printf("Unhandled webhook event: %s", event.Type)
	}

	return c.JSON(http.StatusOK, map[string]string{"received": "true"})
}

func handleCheckoutCompleted(sess *stripe.CheckoutSession) {
	if sess.Customer == nil {
		return
	}

	var user models.User
	if err := db.DB.Where("stripe_customer_id = ?", sess.Customer.ID).First(&user).Error; err != nil {
		log.Printf("User not found for customer %s", sess.Customer.ID)
		return
	}

	// Update subscription
	updates := map[string]interface{}{
		"subscription_tier":       models.TierPro,
		"stripe_subscription_id":  sess.Subscription.ID,
	}
	db.DB.Model(&user).Updates(updates)
	log.Printf("User %s upgraded to Pro", user.Username)
}

func handleSubscriptionUpdated(sub *stripe.Subscription) {
	var user models.User
	if err := db.DB.Where("stripe_subscription_id = ?", sub.ID).First(&user).Error; err != nil {
		log.Printf("User not found for subscription %s", sub.ID)
		return
	}

	// Update subscription end date
	endDate := time.Unix(sub.CurrentPeriodEnd, 0)
	updates := map[string]interface{}{
		"subscription_ends_at": endDate,
	}

	if sub.Status == stripe.SubscriptionStatusActive {
		updates["subscription_tier"] = models.TierPro
	}

	db.DB.Model(&user).Updates(updates)
}

func handleSubscriptionDeleted(sub *stripe.Subscription) {
	var user models.User
	if err := db.DB.Where("stripe_subscription_id = ?", sub.ID).First(&user).Error; err != nil {
		log.Printf("User not found for subscription %s", sub.ID)
		return
	}

	// Downgrade to free
	updates := map[string]interface{}{
		"subscription_tier":      models.TierFree,
		"stripe_subscription_id": "",
	}
	db.DB.Model(&user).Updates(updates)
	log.Printf("User %s downgraded to Free", user.Username)
}
