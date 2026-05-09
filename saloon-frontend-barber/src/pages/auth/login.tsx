import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi, barberApi } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Button, Input, PasswordInput } from '@/components/ui/index'
import { ApiError } from '@/lib/api/client'

const schema = z.object({ email: z.string().email(), password: z.string().min(1) })
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const { login, setBarberId } = useAuthStore()
  const { register, handleSubmit, setError, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(schema), mode: 'onChange',
  })

  const mutation = useMutation({
    mutationFn: (d: FormData) => authApi.login(d.email, d.password),
    onSuccess: async (res) => {
      if (res.user.role !== 'barber') {
        setError('root', { message: 'This portal is for barbers only' })
        return
      }
      login(res.user, res.access_token, res.refresh_token)
      // Fetch barber record to get barberId
      try {
        const barber = await barberApi.getMe()
        setBarberId(barber.id)
      } catch { /* barberId stays null, fetched later */ }
      navigate('/')
    },
    onError: (err) => setError('root', { message: err instanceof ApiError ? err.message : 'Sign in failed' }),
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Barber Portal</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to manage your schedule</p>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          {errors.root && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{errors.root.message}</p>}
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <PasswordInput label="Password" {...register('password')} error={errors.password?.message} />
          <Button type="submit" className="w-full" loading={mutation.isPending} disabled={!isValid}>Sign in</Button>
        </form>
      </div>
    </div>
  )
}
