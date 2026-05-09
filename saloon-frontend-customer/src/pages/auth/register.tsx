import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Input, PasswordInput } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { authApi } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { ApiError } from '@/lib/api/client'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Enter a valid phone number').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuthStore()
  const redirect = searchParams.get('redirect') ?? '/'

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onChange' })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      authApi.register({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        password: data.password,
      }),
    onSuccess: (res) => {
      login(res.user, res.access_token, res.refresh_token)
      navigate(redirect, { replace: true })
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Registration failed'
      setError('root', { message: msg })
    },
  })

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Create your account</h1>
        <p className="text-sm text-gray-500 mt-1">Join to start booking saloons</p>
      </div>

      {errors.root && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {errors.root.message}
        </div>
      )}

      <Input label="Full name" placeholder="Arjun Sharma" error={errors.name?.message} {...register('name')} />
      <Input label="Email" type="email" placeholder="you@example.com" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <Input label="Phone (optional)" type="tel" placeholder="+91 98765 43210" error={errors.phone?.message} {...register('phone')} />
      <PasswordInput label="Password" placeholder="8+ characters" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
      <PasswordInput label="Confirm password" placeholder="Same as above" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />

      <Button
        type="submit"
        className="w-full"
        size="lg"
        loading={mutation.isPending}
        disabled={!isValid}
      >
        Create account
      </Button>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to={`/auth/login?redirect=${encodeURIComponent(redirect)}`} className="text-brand-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
