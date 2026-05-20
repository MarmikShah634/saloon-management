import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Button, Input, PasswordInput } from '@/components/ui/index'
import { ApiError } from '@/lib/api/client'
import { TrendingUp } from 'lucide-react'

const schema = z.object({ email: z.string().email(), password: z.string().min(1) })
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const { login, setSaloonId } = useAuthStore()
  const { register, handleSubmit, setError, formState: { errors, isValid } } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onChange' })

  const mutation = useMutation({
    mutationFn: (d: FormData) => authApi.login(d.email, d.password),
    onSuccess: async (res) => {
      if (res.user.role !== 'owner') {
        setError('root', { message: 'This portal is for saloon owners only.' })
        return
      }
      login(res.user, res.access_token, res.refresh_token)
      try {
        const saloons = await import('@/lib/api/client').then(m => m.api.get<{ items: Array<{ id: string }> }>('/api/v1/saloons?size=1'))
        if (saloons.items[0]) setSaloonId(saloons.items[0].id)
      } catch { /* ignore */ }
      navigate('/')
    },
    onError: (err) => setError('root', { message: err instanceof ApiError ? err.message : 'Sign in failed' }),
  })

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg, #172554 0%, #1e3a8a 35%, #1d4ed8 65%, #172554 100%)', backgroundSize: '300% 300%' }}>
        <div className="absolute top-[-20%] left-[-10%] w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/10 mb-6 border border-white/20">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-3">Your business,<br />at a glance.</h2>
          <p className="text-blue-200 text-lg">Full control over your saloon and team.</p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-center">
            {[['Analytics', 'Real-time insights'], ['Team', 'Manage barbers']].map(([n, l]) => (
              <div key={String(l)} className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <p className="text-base font-bold text-white">{n}</p>
                <p className="text-xs text-blue-200 mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="h-9 w-9 rounded-xl bg-brand-gradient flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Owner<span className="text-brand-600">·</span>Hub</span>
          </div>

          <div className="bg-white rounded-3xl border border-brand-100/60 shadow-card p-8 animate-scale-in">
            <h1 className="text-xl font-extrabold text-gray-900 mb-1">Owner Portal</h1>
            <p className="text-sm text-gray-500 mb-6">Sign in to manage your saloon</p>
            <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
              {errors.root && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                  {errors.root.message}
                </div>
              )}
              <Input label="Email" type="email" placeholder="you@example.com" {...register('email')} error={errors.email?.message} />
              <PasswordInput label="Password" placeholder="••••••••" {...register('password')} error={errors.password?.message} />
              <Button type="submit" className="w-full" size="lg" loading={mutation.isPending} disabled={!isValid}>
                Sign in
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
