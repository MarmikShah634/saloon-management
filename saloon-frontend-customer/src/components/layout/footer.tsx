import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="hidden lg:block border-t border-gray-100 bg-white mt-16">
      <div className="max-w-screen-lg mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-8">
          <p className="text-sm font-bold text-gray-900">
            Saloon<span className="text-brand-600">.</span>
          </p>
          <div className="flex items-center gap-6">
            <Link to="/legal/terms" className="text-xs text-gray-500 hover:text-gray-700">Terms</Link>
            <Link to="/legal/privacy" className="text-xs text-gray-500 hover:text-gray-700">Privacy</Link>
            <a href="#" className="text-xs text-gray-500 hover:text-gray-700">For business</a>
          </div>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Saloon Platform</p>
        </div>
      </div>
    </footer>
  )
}
