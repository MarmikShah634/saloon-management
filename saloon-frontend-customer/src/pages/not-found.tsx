import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
      <h1 className="text-xl font-bold text-gray-900 mb-2">We couldn't find that page</h1>
      <p className="text-sm text-gray-500 mb-6">The page you're looking for doesn't exist or has moved.</p>
      <Button variant="secondary" onClick={() => navigate('/')}>Back to home</Button>
    </div>
  )
}
