import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ownerApi } from '@/lib/api/endpoints'
import { Button, Input, useToast } from '@/components/ui/index'
import { ArrowLeft } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function NewOwnerPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onChange' })

  const mutation = useMutation({
    mutationFn: (d: FormData) => ownerApi.create(d),
    onSuccess: (user) => { toast({ type: 'success', title: 'Owner created — invite email sent' }); navigate(`/owners/${user.id}`) },
    onError: (err: Error) => toast({ type: 'error', title: err.message }),
  })

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/owners')} className="text-slate-400 hover:text-slate-700"><ArrowLeft className="h-4 w-4" /></button>
        <h1 className="text-xl font-bold text-slate-900">Create owner</h1>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-sm text-slate-500 mb-4">The owner will receive an email to set their password.</p>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <Input label="Full name" {...register('name')} error={errors.name?.message} />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Phone (optional)" type="tel" {...register('phone')} />
          <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={() => navigate('/owners')}>Cancel</Button>
            <Button type="submit" loading={mutation.isPending} disabled={!isValid}>Create owner</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
