# Stripe Setup Guide

## 1. Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and sign up
2. Complete account verification (for production)

## 2. Get API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your keys:
   - **Publishable key**: `pk_test_...` (frontend, if needed)
   - **Secret key**: `sk_test_...` (backend)

## 3. Create a Product & Price

1. Go to [Products](https://dashboard.stripe.com/products)
2. Click "Add product"
3. Fill in:
   - **Name**: "NestKeeper Pro"
   - **Description**: "Unlimited properties, tax reports, and more"
4. Add a price:
   - **Pricing model**: Recurring
   - **Amount**: $9.00
   - **Billing period**: Monthly
5. Click "Save product"
6. Copy the **Price ID** (starts with `price_...`)

## 4. Set Up Webhook

1. Go to [Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://yourdomain.com/api/billing/webhook`
4. Select events to listen:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. Copy the **Webhook signing secret** (starts with `whsec_...`)

## 5. Configure Environment Variables

Add these to your deployment environment:

```bash
# Required
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PRO_PRICE_ID=price_your_price_id
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Optional
APP_URL=https://yourdomain.com
```

### For Docker Compose:

```yaml
services:
  nestkeeper:
    environment:
      - STRIPE_SECRET_KEY=sk_test_...
      - STRIPE_PRO_PRICE_ID=price_...
      - STRIPE_WEBHOOK_SECRET=whsec_...
      - APP_URL=https://yourdomain.com
```

### For Oracle Cloud:

```bash
# Edit docker-compose.yml
nano /opt/nestkeeper/docker-compose.yml

# Add environment variables under nestkeeper service
```

## 6. Test the Integration

### Test Mode
1. Use test API keys (start with `sk_test_`)
2. Use [Stripe test cards](https://stripe.com/docs/testing):
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
3. Any future expiry date and CVC

### Webhook Testing (Local Development)
1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run: `stripe listen --forward-to localhost:3000/api/billing/webhook`
3. Use the webhook secret from CLI output

## 7. Go Live

1. Complete Stripe account verification
2. Switch to live API keys (`sk_live_...`)
3. Create production product/price
4. Update webhook endpoint URL
5. Update environment variables with live keys

## Pricing Recommendations

For a property management SaaS:

| Plan | Price | Target |
|------|-------|--------|
| Free | $0 | Hobbyist (1-3 units) |
| Pro | $9/mo | Serious landlord (4-10 units) |
| Business | $29/mo | Property manager (10+ units) |

## Feature Gating Examples

```go
// In your handlers, check user.IsPro()
if !user.IsPro() && propertyCount >= 3 {
    return c.JSON(http.StatusForbidden, map[string]string{
        "error": "Upgrade to Pro to add more properties",
    })
}
```

```typescript
// In frontend
if (!user.isPro && properties.length >= 3) {
  showUpgradePrompt()
}
```
