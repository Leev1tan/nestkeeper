import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export function Login() {
  const navigate = useNavigate()
  const { login, register, isAuthenticated } = useAuth()

  const [isSetup, setIsSetup] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
      return
    }

    // Check if this is first-time setup
    fetch('/api/auth/setup')
      .then(res => res.json())
      .then(data => {
        setIsSetup(!data.setupComplete)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (isSetup) {
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setIsSubmitting(false)
          return
        }
        await register(username, password, email)
      } else {
        await login(username, password)
      }
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-3xl font-bold mb-2">NestKeeper</div>
          <CardTitle>
            {isSetup ? 'Create Your Account' : 'Welcome Back'}
          </CardTitle>
          {isSetup && (
            <p className="text-sm text-muted-foreground mt-2">
              Set up your admin account to get started
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-1">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                autoComplete="username"
              />
            </div>

            {isSetup && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email (optional)
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSetup ? 'At least 8 characters' : 'Enter password'}
                required
                minLength={isSetup ? 8 : undefined}
                autoComplete={isSetup ? 'new-password' : 'current-password'}
              />
            </div>

            {isSetup && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                />
              </div>
            )}

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? (isSetup ? 'Creating Account...' : 'Signing In...')
                : (isSetup ? 'Create Account' : 'Sign In')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
