import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { authApi } from '@/lib/api/endpoints'

const schema = z.object({ email: z.string().email('Enter a valid email') })

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>({
    resolver: zodResolver(schema),
  })
  const mutation = useMutation({
    mutationFn: (d: { email: string }) => authApi.forgotPassword(d.email),
    onSuccess: () => setSent(true),
  })

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
          <span className="text-2xl">✓</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Check your email</h1>
        <p className="text-sm text-gray-500">
          If this email exists, a reset link has been sent.
        </p>
        <Link to="/auth/login" className="text-sm text-brand-600 font-medium hover:underline block">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Reset your password</h1>
        <p className="text-sm text-gray-500 mt-1">We'll send a reset link to your email</p>
      </div>
      <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
      <Button type="submit" className="w-full" size="lg" loading={mutation.isPending}>
        Send reset link
      </Button>
      <p className="text-center text-sm">
        <Link to="/auth/login" className="text-brand-600 font-medium hover:underline">Back to sign in</Link>
      </p>
    </form>
  )
}
