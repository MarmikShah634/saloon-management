import { Outlet, Link } from 'react-router-dom'
import { Scissors } from 'lucide-react'

export function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel (desktop) */}
      <div className="hidden lg:flex w-1/2 hero-gradient relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Decorative blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 rounded-full bg-brand-400/20 blur-3xl" />

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/10 mb-6 border border-white/20">
            <Scissors className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-3">
            Look your best,<br />every time.
          </h2>
          <p className="text-brand-200 text-lg">
            Book the best saloons near you<br />in under 60 seconds.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[['500+', 'Saloons'], ['50k+', 'Bookings'], ['4.9★', 'Rating']].map(([n, l]) => (
              <div key={l} className="bg-white/10 rounded-2xl p-3 border border-white/10">
                <p className="text-xl font-bold text-white">{n}</p>
                <p className="text-xs text-brand-200 mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-surface-soft">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-brand-gradient flex items-center justify-center">
                <Scissors className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Saloon</span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-card border border-brand-100/60 p-8 animate-scale-in">
            <Outlet />
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            By continuing, you agree to our{' '}
            <Link to="/legal/terms" className="underline hover:text-brand-600">Terms</Link>
            {' '}and{' '}
            <Link to="/legal/privacy" className="underline hover:text-brand-600">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
