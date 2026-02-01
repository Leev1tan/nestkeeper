import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Building,
  DollarSign,
  FileText,
  Wrench,
  Shield,
  Smartphone,
  Check,
  ArrowRight
} from 'lucide-react'

const features = [
  {
    icon: Building,
    title: 'Property Management',
    description: 'Track all your properties and units in one place. Single-family, multi-family, condos.',
  },
  {
    icon: DollarSign,
    title: 'Rent Tracking',
    description: 'Log payments in seconds. See who paid, who\'s late, and total income at a glance.',
  },
  {
    icon: Wrench,
    title: 'Maintenance Scheduling',
    description: 'Never miss HVAC filter changes or inspections. Automated reminders keep you compliant.',
  },
  {
    icon: FileText,
    title: 'Tax Reports',
    description: 'Generate IRS Schedule E reports instantly. All expenses categorized automatically.',
  },
  {
    icon: Shield,
    title: 'Privacy-First',
    description: 'Self-hosted on your own server. Your data never touches third-party clouds.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-Friendly',
    description: 'Log rent payments from your phone in under 5 seconds. Works offline too.',
  },
]

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      'Up to 3 properties',
      'Unlimited tenants & leases',
      'Rent tracking',
      'Basic maintenance tasks',
      'Manual backups',
    ],
    cta: 'Get Started',
    href: '/login',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    description: 'For growing landlords',
    features: [
      'Unlimited properties',
      'Schedule E tax reports',
      'Email notifications',
      'Automatic backups',
      'Document storage (10GB)',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    href: '/login?plan=pro',
    highlighted: true,
  },
]

export function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-xl font-bold">NestKeeper</div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Sign In
            </Link>
            <Button asChild size="sm">
              <Link to="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Property Management for{' '}
            <span className="text-primary">Small Landlords</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Track rent, manage maintenance, and generate tax reports — all from a simple,
            privacy-first app you control. Built for landlords with 1-10 units.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/login">
                Start Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#features">See Features</a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required. Self-host on your own server.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to manage your rentals
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <feature.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Start free, upgrade when you need more
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.highlighted ? 'border-primary shadow-lg' : ''}
              >
                <CardContent className="pt-6">
                  {plan.highlighted && (
                    <div className="text-xs font-medium text-primary mb-2">MOST POPULAR</div>
                  )}
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <div className="mt-2 mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? 'default' : 'outline'}
                    asChild
                  >
                    <Link to={plan.href}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">
            Ready to simplify your property management?
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Join landlords who save hours every month with NestKeeper.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/login">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} NestKeeper. Self-hosted property management.
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="https://github.com/Leev1tan/nestkeeper" className="hover:text-foreground">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
