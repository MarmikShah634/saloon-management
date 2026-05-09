import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Button, Input, PasswordInput } from '@/components/ui/index'
import { ApiError } from '@/lib/api/client'

const schema = z.object({ email: z.string().email(), password: z.string().min(1) })
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { register, handleSubmit, setError, formState: { errors, isValid } } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onChange' })

  const mutation = useMutation({
    mutationFn: (d: FormData) => authApi.login(d.email, d.password),
    onSuccess: (res) => {
      if (res.user.role !== 'super_admin') { setError('root', { message: 'Access denied — super-admin accounts only' }); return }
      login(res.user, res.access_token, res.refresh_token)
      navigate('/')
    },
    onError: (err) => setError('root', { message: err instanceof ApiError ? err.message : 'Authentication failed' }),
  })

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl border border-slate-200 p-8">
        <div className="mb-6">
          <p className="text-xs font-mono text-slate-400 mb-1 uppercase tracking-wider">Saloon Platform</p>
          <h1 className="text-xl font-bold text-slate-900">Admin Console</h1>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          {errors.root && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{errors.root.message}</p>
          )}
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <PasswordInput label="Password" {...register('password')} error={errors.password?.message} />
          <Button type="submit" className="w-full" loading={mutation.isPending} disabled={!isValid}>Sign in</Button>
        </form>
        <div className="mt-4 text-center">
          <a href="/auth/forgot" className="text-xs text-slate-500 hover:text-slate-700">Forgot password?</a>
        </div>
      </div>
    </div>
  )
}
