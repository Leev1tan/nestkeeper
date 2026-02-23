import { Link } from 'react-router-dom'
import { ArrowRight, Check, CheckCircle, AlertCircle, Clock, Wrench, FileText, Calendar, ChevronRight } from 'lucide-react'

export function Landing() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8', color: '#18181B' }}>

      {/* Nav */}
      <header style={{ borderBottom: '1px solid #E7E5E4' }}>
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <div className="font-bold text-lg tracking-tight">NestKeeper</div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm hidden sm:block" style={{ color: '#71717A' }}>Features</a>
            <a href="#pricing" className="text-sm hidden sm:block" style={{ color: '#71717A' }}>Pricing</a>
            <Link to="/login" className="text-sm" style={{ color: '#71717A' }}>Sign in</Link>
            <Link
              to="/login"
              className="text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-1.5"
              style={{ backgroundColor: '#18181B', color: '#FAFAF8' }}
            >
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-16 px-6" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, #FEF3C720 0%, transparent 70%)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div>
              <div
                className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-8"
                style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                Free for landlords with up to 3 units
              </div>

              <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-6">
                Manage your rentals,<br />
                not your{' '}
                <span style={{ color: '#D97706' }}>spreadsheets</span>
              </h1>

              <p className="text-lg mb-8 leading-relaxed" style={{ color: '#52525B' }}>
                Track rent payments, schedule maintenance, and generate tax reports.
                Built for landlords with 1–10 units who have better things to do.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm"
                  style={{ backgroundColor: '#18181B', color: '#FAFAF8' }}
                >
                  Start free — no card needed
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm"
                  style={{ border: '1px solid #D4D4D8', color: '#3F3F46' }}
                >
                  See how it works
                </a>
              </div>
            </div>

            {/* Right — dashboard mockup */}
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-zinc-200" style={{ border: '1px solid #E4E4E7' }}>
              {/* Mockup header bar */}
              <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: '#F4F4F5', borderBottom: '1px solid #E4E4E7' }}>
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-xs ml-2" style={{ color: '#A1A1AA' }}>nestkeeper.app/rent</span>
              </div>

              {/* Mockup content */}
              <div className="p-5 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-semibold text-sm">Rent Status</div>
                    <div className="text-xs" style={{ color: '#71717A' }}>February 2026</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">$3,600</div>
                    <div className="text-xs" style={{ color: '#71717A' }}>of $4,800 collected</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { unit: '123 Oak St — Unit 1', tenant: 'Sarah M.', status: 'paid', amount: '$1,200' },
                    { unit: '123 Oak St — Unit 2', tenant: 'James K.', status: 'paid', amount: '$1,150' },
                    { unit: '456 Elm Ave', tenant: 'Maria R.', status: 'paid', amount: '$1,250' },
                    { unit: '789 Pine Rd', tenant: 'Tom H.', status: 'overdue', amount: '$1,200' },
                  ].map((row) => (
                    <div
                      key={row.unit}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                      style={{ backgroundColor: row.status === 'overdue' ? '#FFF7ED' : '#F9F9F9' }}
                    >
                      <div className="flex items-center gap-2.5">
                        {row.status === 'paid'
                          ? <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: '#16A34A' }} />
                          : <AlertCircle className="h-4 w-4 flex-shrink-0" style={{ color: '#EA580C' }} />
                        }
                        <div>
                          <div className="text-xs font-medium">{row.unit}</div>
                          <div className="text-xs" style={{ color: '#A1A1AA' }}>{row.tenant}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold">{row.amount}</div>
                        <div
                          className="text-xs"
                          style={{ color: row.status === 'paid' ? '#16A34A' : '#EA580C' }}
                        >
                          {row.status === 'paid' ? 'Paid' : 'Overdue'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4" style={{ borderTop: '1px solid #F4F4F5' }}>
                  <div className="flex items-center justify-between text-xs" style={{ color: '#71717A' }}>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Next due: March 1</span>
                    <span>3 of 4 paid</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full" style={{ backgroundColor: '#F4F4F5' }}>
                    <div className="h-1.5 rounded-full" style={{ width: '75%', backgroundColor: '#16A34A' }} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ borderTop: '1px solid #E7E5E4', borderBottom: '1px solid #E7E5E4', backgroundColor: '#F5F5F4' }}>
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto text-center">
            {[
              { value: '< 5s', label: 'to log a payment' },
              { value: '$0', label: 'to get started' },
              { value: '100%', label: 'your data, your server' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-black tracking-tight mb-1">{stat.value}</div>
                <div className="text-xs" style={{ color: '#71717A' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-14">
            <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#D97706' }}>
              Features
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              Everything you need, nothing you don't
            </h2>
          </div>

          <div className="space-y-12">
            {[
              {
                title: 'Rent tracking that takes seconds',
                description: 'Mark payments as paid, partial, or overdue from your phone. See who\'s late at a glance without digging through emails or spreadsheets.',
                points: ['One-tap payment logging', 'Automatic overdue detection', 'Full payment history per tenant'],
              },
              {
                title: 'Maintenance that doesn\'t slip through',
                description: 'Set up recurring tasks — HVAC filters, smoke detector checks, annual inspections. Complete one and the next is scheduled automatically.',
                points: ['Recurring task templates', 'Auto-scheduling on completion', 'Category tracking for records'],
              },
              {
                title: 'Tax time in minutes, not days',
                description: 'Every expense logged throughout the year maps directly to IRS Schedule E categories. Export a report when you need it.',
                points: ['Schedule E categories built in', 'Expense receipt storage', 'One-click annual report'],
              },
            ].map((feature, i) => (
              <div key={feature.title} className="grid md:grid-cols-2 gap-10 items-start">
                <div className={i % 2 === 1 ? 'md:order-2' : ''}>
                  <div className="text-xs font-bold mb-3" style={{ color: '#D97706' }}>0{i + 1}</div>
                  <h3 className="text-xl font-bold tracking-tight mb-3">{feature.title}</h3>
                  <p className="leading-relaxed mb-5" style={{ color: '#52525B' }}>{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.points.map((p) => (
                      <li key={p} className="flex items-center gap-2.5 text-sm" style={{ color: '#3F3F46' }}>
                        <Check className="h-4 w-4 flex-shrink-0" style={{ color: '#D97706' }} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={i % 2 === 1 ? 'md:order-1' : ''}>
                  {i === 0 && (
                    <div className="rounded-xl p-4 bg-white shadow-sm" style={{ border: '1px solid #E4E4E7' }}>
                      <div className="text-xs font-semibold mb-3" style={{ color: '#71717A' }}>Recent payments</div>
                      <div className="space-y-2">
                        {[
                          { name: 'James K.', unit: 'Unit 2', amount: '$1,150', time: '2 min ago', paid: true },
                          { name: 'Sarah M.', unit: 'Unit 1', amount: '$1,200', time: '1 hr ago', paid: true },
                          { name: 'Tom H.', unit: '789 Pine Rd', amount: '$1,200', time: '3 days ago', paid: false },
                        ].map((p) => (
                          <div key={p.name} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #F4F4F5' }}>
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#F5F5F4', color: '#71717A' }}>
                                {p.name[0]}
                              </div>
                              <div>
                                <div className="text-xs font-medium">{p.name}</div>
                                <div className="text-xs" style={{ color: '#A1A1AA' }}>{p.unit}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-semibold">{p.amount}</div>
                              <div className="text-xs" style={{ color: p.paid ? '#16A34A' : '#EA580C' }}>{p.paid ? 'Paid' : 'Overdue'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {i === 1 && (
                    <div className="rounded-xl p-4 bg-white shadow-sm" style={{ border: '1px solid #E4E4E7' }}>
                      <div className="text-xs font-semibold mb-3" style={{ color: '#71717A' }}>Upcoming tasks</div>
                      <div className="space-y-2.5">
                        {[
                          { name: 'HVAC filter replacement', due: 'Mar 1', tag: 'HVAC', urgent: false },
                          { name: 'Smoke detector check', due: 'Mar 5', tag: 'Safety', urgent: false },
                          { name: 'Annual inspection', due: 'Overdue', tag: 'Legal', urgent: true },
                        ].map((t) => (
                          <div key={t.name} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid #F4F4F5' }}>
                            <Wrench className="h-3.5 w-3.5 flex-shrink-0" style={{ color: t.urgent ? '#EA580C' : '#A1A1AA' }} />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate">{t.name}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F4F4F5', color: '#71717A' }}>{t.tag}</span>
                              </div>
                            </div>
                            <div className="text-xs flex-shrink-0 flex items-center gap-1" style={{ color: t.urgent ? '#EA580C' : '#71717A' }}>
                              <Calendar className="h-3 w-3" />{t.due}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {i === 2 && (
                    <div className="rounded-xl p-4 bg-white shadow-sm" style={{ border: '1px solid #E4E4E7' }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-semibold" style={{ color: '#71717A' }}>2025 Schedule E</div>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>Ready</span>
                      </div>
                      <div className="space-y-2">
                        {[
                          { label: 'Repairs & maintenance', amount: '$4,820' },
                          { label: 'Insurance', amount: '$2,400' },
                          { label: 'Property taxes', amount: '$6,100' },
                          { label: 'Depreciation', amount: '$9,230' },
                        ].map((row) => (
                          <div key={row.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #F4F4F5' }}>
                            <div className="flex items-center gap-2">
                              <FileText className="h-3 w-3" style={{ color: '#A1A1AA' }} />
                              <span className="text-xs" style={{ color: '#52525B' }}>{row.label}</span>
                            </div>
                            <span className="text-xs font-semibold">{row.amount}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-xs font-medium" style={{ color: '#D97706' }}>
                        Export PDF <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6" style={{ backgroundColor: '#F5F5F4' }}>
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#D97706' }}>
              Pricing
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-2">Start free, upgrade when ready</h2>
            <p style={{ color: '#71717A' }}>No credit card required to get started</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="rounded-2xl p-7 bg-white" style={{ border: '1px solid #E4E4E7' }}>
              <div className="font-bold text-lg mb-1">Free</div>
              <div className="mb-4">
                <span className="text-4xl font-black">$0</span>
                <span className="text-sm ml-1" style={{ color: '#71717A' }}>forever</span>
              </div>
              <p className="text-sm mb-6" style={{ color: '#71717A' }}>Perfect for getting started</p>
              <ul className="space-y-2.5 mb-7">
                {['Up to 3 properties', 'Unlimited tenants & leases', 'Rent tracking', 'Basic maintenance tasks', 'Manual backups'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check className="h-4 w-4 flex-shrink-0" style={{ color: '#A1A1AA' }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className="block text-center py-2.5 rounded-lg text-sm font-semibold"
                style={{ border: '1.5px solid #D4D4D8', color: '#3F3F46' }}
              >
                Get started free
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-2xl p-7" style={{ backgroundColor: '#18181B', color: '#FAFAF8' }}>
              <div className="text-xs font-semibold mb-3" style={{ color: '#D97706' }}>MOST POPULAR</div>
              <div className="font-bold text-lg mb-1">Pro</div>
              <div className="mb-4">
                <span className="text-4xl font-black">$7.9</span>
                <span className="text-sm ml-1" style={{ color: '#A1A1AA' }}>/month</span>
              </div>
              <p className="text-sm mb-6" style={{ color: '#A1A1AA' }}>For growing landlords</p>
              <ul className="space-y-2.5 mb-7">
                {['Unlimited properties', 'Schedule E tax reports', 'Email notifications', 'Automatic backups', 'Document storage (10GB)', 'Priority support'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check className="h-4 w-4 flex-shrink-0" style={{ color: '#D97706' }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/login?plan=pro"
                className="block text-center py-2.5 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: '#D97706', color: '#18181B' }}
              >
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6" style={{ backgroundColor: '#18181B' }}>
        <div className="container mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-black tracking-tight mb-4" style={{ color: '#FAFAF8' }}>
            Ready to ditch the spreadsheet?
          </h2>
          <p className="mb-8" style={{ color: '#A1A1AA' }}>
            Free forever for up to 3 properties. No credit card, no setup fees.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg font-semibold text-sm"
            style={{ backgroundColor: '#D97706', color: '#18181B' }}
          >
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6" style={{ backgroundColor: '#18181B', borderTop: '1px solid #27272A' }}>
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm font-bold" style={{ color: '#FAFAF8' }}>NestKeeper</div>
          <div className="flex gap-6 text-sm" style={{ color: '#71717A' }}>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="https://github.com/Leev1tan/nestkeeper" className="hover:text-white transition-colors">GitHub</a>
          </div>
          <div className="text-sm" style={{ color: '#52525B' }}>
            © {new Date().getFullYear()} NestKeeper
          </div>
        </div>
      </footer>

    </div>
  )
}
