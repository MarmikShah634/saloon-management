import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { PasswordInput } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { authApi } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/client'

const schema = z.object({
  password: z.string().min(8, 'At least 8 characters'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: "Passwords don't match", path: ['confirm'] })

type FormData = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const { register, handleSubmit, setError, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(schema), mode: 'onChange',
  })

  const mutation = useMutation({
    mutationFn: (d: FormData) => authApi.resetPassword(token, d.password),
    onSuccess: () => navigate('/auth/login?flash=reset'),
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Reset failed'
      setError('root', { message: msg })
    },
  })

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Set new password</h1>
        <p className="text-sm text-gray-500 mt-1">Choose a strong password</p>
      </div>
      {errors.root && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {errors.root.message}
        </div>
      )}
      <PasswordInput label="New password" placeholder="8+ characters" error={errors.password?.message} {...register('password')} />
      <PasswordInput label="Confirm password" placeholder="Same as above" error={errors.confirm?.message} {...register('confirm')} />
      <Button type="submit" className="w-full" size="lg" loading={mutation.isPending} disabled={!isValid || !token}>
        Reset password
      </Button>
      <p className="text-center text-sm">
        <Link to="/auth/login" className="text-brand-600 font-medium hover:underline">Back to sign in</Link>
      </p>
    </form>
  )
}
