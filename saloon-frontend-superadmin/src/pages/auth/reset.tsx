import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/lib/api/endpoints'
import { Button, PasswordInput } from '@/components/ui/index'

const schema = z.object({
  password: z.string().min(8),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })
type FormData = z.infer<typeof schema>

export function ResetPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const mutation = useMutation({
    mutationFn: (d: FormData) => authApi.resetPassword(token, d.password),
    onSuccess: () => navigate('/auth/login'),
  })
  if (!token) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><p className="text-white">Invalid reset link.</p></div>
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-8">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Set new password</h1>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <PasswordInput label="New password" {...register('password')} error={errors.password?.message} />
          <PasswordInput label="Confirm password" {...register('confirm')} error={errors.confirm?.message} />
          <Button type="submit" className="w-full" loading={mutation.isPending} disabled={!isValid}>Set password</Button>
        </form>
      </div>
    </div>
  )
}
