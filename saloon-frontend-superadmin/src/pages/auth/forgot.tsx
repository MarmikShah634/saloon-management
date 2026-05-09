import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/lib/api/endpoints'
import { Button, Input } from '@/components/ui/index'

const schema = z.object({ email: z.string().email() })
type FormData = z.infer<typeof schema>

export function ForgotPage() {
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onChange' })
  const mutation = useMutation({ mutationFn: (d: FormData) => authApi.forgotPassword(d.email) })
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-8">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Reset password</h1>
        <p className="text-sm text-slate-500 mb-6">Enter your email and we'll send a reset link.</p>
        {mutation.isSuccess ? (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">Check your inbox for a reset link.</p>
        ) : (
          <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
            <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
            <Button type="submit" className="w-full" loading={mutation.isPending} disabled={!isValid}>Send reset link</Button>
          </form>
        )}
        <div className="mt-4 text-center"><a href="/auth/login" className="text-xs text-slate-500 hover:text-slate-700">Back to sign in</a></div>
      </div>
    </div>
  )
}
