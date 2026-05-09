import { Outlet, Link } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="mb-8 text-2xl font-bold text-gray-900">
        Saloon<span className="text-brand-600">.</span>
      </Link>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <Outlet />
      </div>
    </div>
  )
}
