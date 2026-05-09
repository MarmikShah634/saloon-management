import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { saloonApi, ownerApi } from '@/lib/api/endpoints'
import { Button, Input, useToast } from '@/components/ui/index'
import { ArrowLeft } from 'lucide-react'

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
]

const schema = z.discriminatedUnion('ownerMode', [
  z.object({
    ownerMode: z.literal('existing'),
    name: z.string().min(2), address: z.string().min(5), city: z.string().min(2),
    timezone: z.string().min(1), owner_id: z.string().min(1),
    status: z.enum(['pending_approval', 'active']),
  }),
  z.object({
    ownerMode: z.literal('new'),
    name: z.string().min(2), address: z.string().min(5), city: z.string().min(2),
    timezone: z.string().min(1), status: z.enum(['pending_approval', 'active']),
    owner_name: z.string().min(2), owner_email: z.string().email(), owner_phone: z.string().optional(),
  }),
])
type FormData = z.infer<typeof schema>

export function NewSaloonPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [ownerMode, setOwnerMode] = useState<'existing' | 'new'>('existing')

  const { register, handleSubmit, setValue, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { ownerMode: 'existing', timezone: 'UTC', status: 'pending_approval' } as FormData,
    mode: 'onChange',
  })

  const createMutation = useMutation({
    mutationFn: async (d: FormData) => {
      let owner_id: string
      if (d.ownerMode === 'new') {
        const owner = await ownerApi.create({ name: d.owner_name, email: d.owner_email, phone: d.owner_phone })
        owner_id = owner.id
      } else {
        owner_id = d.owner_id
      }
      return saloonApi.create({ name: d.name, address: d.address, city: d.city, timezone: d.timezone, owner_id, status: d.status })
    },
    onSuccess: (saloon) => { toast({ type: 'success', title: 'Saloon created' }); navigate(`/saloons/${saloon.id}`) },
    onError: (err: Error) => toast({ type: 'error', title: err.message }),
  })

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/saloons')} className="text-slate-400 hover:text-slate-700"><ArrowLeft className="h-4 w-4" /></button>
        <h1 className="text-xl font-bold text-slate-900">Create saloon</h1>
      </div>

      <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-700">Saloon details</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Saloon name" {...register('name')} error={(errors as { name?: { message?: string } }).name?.message} />
            <Input label="City" {...register('city')} error={(errors as { city?: { message?: string } }).city?.message} />
            <Input label="Address" {...register('address')} error={(errors as { address?: { message?: string } }).address?.message} />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Timezone</label>
              <select {...register('timezone')} className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300">
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Initial status</label>
            <select {...register('status')} className="h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 max-w-xs">
              <option value="pending_approval">Pending approval</option>
              <option value="active">Active (approved)</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Owner</p>
            <div className="flex gap-1 text-xs">
              {(['existing', 'new'] as const).map(m => (
                <button key={m} type="button" onClick={() => { setOwnerMode(m); setValue('ownerMode', m) }}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${ownerMode === m ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {m === 'existing' ? 'Existing owner' : 'Create new owner'}
                </button>
              ))}
            </div>
          </div>
          {ownerMode === 'existing' ? (
            <Input label="Owner ID (UUID)" {...register('owner_id' as 'owner_id')} placeholder="paste owner UUID…" error={(errors as { owner_id?: { message?: string } }).owner_id?.message} />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Owner name" {...register('owner_name' as 'owner_name')} error={(errors as { owner_name?: { message?: string } }).owner_name?.message} />
              <Input label="Owner email" type="email" {...register('owner_email' as 'owner_email')} error={(errors as { owner_email?: { message?: string } }).owner_email?.message} />
              <Input label="Owner phone (optional)" type="tel" {...register('owner_phone' as 'owner_phone')} />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/saloons')}>Cancel</Button>
          <Button type="submit" loading={createMutation.isPending} disabled={!isValid}>Create saloon</Button>
        </div>
      </form>
    </div>
  )
}
