import { useParams } from 'react-router-dom'

export function LegalPage({ type }: { type: 'terms' | 'privacy' }) {
  return (
    <div className="max-w-screen-sm mx-auto px-4 py-8 prose prose-sm text-gray-700">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        {type === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
      </h1>
      <p className="text-gray-500 text-sm mb-6">Last updated: {new Date().toLocaleDateString()}</p>
      <p>This is a placeholder for the {type === 'terms' ? 'Terms of Service' : 'Privacy Policy'}. Content will be populated before public launch.</p>
    </div>
  )
}
