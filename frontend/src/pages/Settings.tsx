import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Check, Crown, Loader2 } from 'lucide-react'

const proFeatures = [
  'Unlimited properties',
  'Schedule E tax reports',
  'Email notifications',
  'Automatic backups',
  'Document storage (10GB)',
  'Priority support',
]

const freeFeatures = [
  'Up to 3 properties',
  'Unlimited tenants & leases',
  'Rent tracking',
  'Basic maintenance tasks',
]

export function Settings() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Failed to create portal session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and subscription</p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground">Username</div>
            <div className="font-medium">{user?.username}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Email</div>
            <div className="font-medium">{user?.email || 'Not set'}</div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Subscription
            {user?.isPro && <Crown className="h-5 w-5 text-yellow-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user?.isPro ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary text-primary-foreground">
                  Pro Plan
                </span>
              </div>
              <p className="text-muted-foreground">
                You have access to all Pro features.
              </p>
              <ul className="space-y-2">
                {proFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant="outline" onClick={handleManageSubscription} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Manage Subscription
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted">
                  Free Plan
                </span>
              </div>
              <p className="text-muted-foreground">
                Upgrade to Pro to unlock all features.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-2">Your current features:</div>
                  <ul className="space-y-1">
                    {freeFeatures.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Pro features:</div>
                  <ul className="space-y-1">
                    {proFeatures.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-primary">
                        <Check className="h-4 w-4" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold">$9</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <Button onClick={handleUpgrade} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Upgrade to Pro
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
