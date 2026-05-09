import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, UserCheck, UserX } from 'lucide-react'
import { barberApi } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Button, Input, Modal, Skeleton, useToast } from '@/components/ui/index'
import type { Barber } from '@/lib/api/endpoints'

const inviteSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().optional(),
})
type InviteData = z.infer<typeof inviteSchema>

export function BarbersPage() {
  const { saloonId } = useAuthStore()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [showInvite, setShowInvite] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['barbers', saloonId],
    queryFn: () => barberApi.list(saloonId!),
    enabled: !!saloonId,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteData>({ resolver: zodResolver(inviteSchema) })

  const inviteMutation = useMutation({
    mutationFn: (d: InviteData) => barberApi.invite(saloonId!, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['barbers'] }); setShowInvite(false); reset(); toast({ type: 'success', title: 'Barber invited' }) },
    onError: () => toast({ type: 'error', title: 'Failed to invite barber' }),
  })

  const toggleMutation = useMutation({
    mutationFn: (b: Barber) => barberApi.update(b.id, { is_active: !b.is_active }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['barbers'] }); toast({ type: 'success', title: 'Barber updated' }) },
  })

  const barbers = data?.items ?? []

  return (
    <div className="p-4 lg:p-6 max-w-screen-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Barbers</h1>
        <Button size="sm" onClick={() => setShowInvite(true)}><Plus className="h-4 w-4" />Add barber</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : barbers.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-3">No barbers yet</p>
          <Button variant="secondary" size="sm" onClick={() => setShowInvite(true)}>Invite a barber</Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {barbers.map((barber, i) => (
            <div key={barber.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                {barber.user.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{barber.user.name}</p>
                <p className="text-xs text-gray-500">{barber.user.email} · {barber.barber_services.length} services</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${barber.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {barber.is_active ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={() => toggleMutation.mutate(barber)}
                className="p-1.5 rounded-lg hover:bg-gray-100"
                aria-label={barber.is_active ? 'Deactivate' : 'Activate'}
              >
                {barber.is_active ? <UserX className="h-4 w-4 text-red-500" /> : <UserCheck className="h-4 w-4 text-brand-600" />}
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite barber">
        <p className="text-sm text-gray-500 mb-4">They'll receive an email to set their password.</p>
        <form onSubmit={handleSubmit(d => inviteMutation.mutate(d))} className="space-y-3">
          <Input label="Full name" {...register('name')} error={errors.name?.message} />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Phone (optional)" type="tel" {...register('phone')} />
          <Button type="submit" className="w-full" loading={inviteMutation.isPending}>Send invite</Button>
        </form>
      </Modal>
    </div>
  )
}
