import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { saloonApi } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Button, Input, Skeleton, useToast } from '@/components/ui/index'

const schema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  address: z.string().min(5),
  city: z.string().min(2),
  timezone: z.string().min(1),
  phone: z.string().optional(),
  instagram_handle: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Istanbul',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney',
]

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface WorkingHoursRow {
  weekday: number
  is_open: boolean
  open_time: string
  close_time: string
}

export function SaloonPage() {
  const { saloonId } = useAuthStore()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [editMode, setEditMode] = useState(false)
  const [hours, setHours] = useState<WorkingHoursRow[]>(
    Array.from({ length: 7 }, (_, i) => ({ weekday: i, is_open: i >= 1 && i <= 6, open_time: '09:00', close_time: '18:00' }))
  )

  const { data: saloon, isLoading } = useQuery({
    queryKey: ['saloon-detail', saloonId],
    queryFn: () => saloonApi.get(saloonId!),
    enabled: !!saloonId,
    onSuccess: (s: any) => {
      if (s.working_hours?.length) {
        const map: Record<number, WorkingHoursRow> = {}
        s.working_hours.forEach((wh: any) => {
          map[wh.weekday] = { weekday: wh.weekday, is_open: wh.is_open, open_time: wh.open_time?.slice(0, 5) ?? '09:00', close_time: wh.close_time?.slice(0, 5) ?? '18:00' }
        })
        setHours(Array.from({ length: 7 }, (_, i) => map[i] ?? { weekday: i, is_open: false, open_time: '09:00', close_time: '18:00' }))
      }
    },
  } as any)

  const { register, handleSubmit, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: saloon ? {
      name: saloon.name,
      description: saloon.description ?? '',
      address: saloon.address,
      city: saloon.city,
      timezone: saloon.timezone,
      phone: saloon.phone ?? '',
      instagram_handle: saloon.instagram_handle ?? '',
    } : undefined,
  })

  const updateMutation = useMutation({
    mutationFn: (d: FormData) => saloonApi.update(saloonId!, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saloon-detail', saloonId] })
      setEditMode(false)
      toast({ type: 'success', title: 'Saloon updated' })
    },
    onError: () => toast({ type: 'error', title: 'Failed to update saloon' }),
  })

  const hoursMutation = useMutation({
    mutationFn: () => saloonApi.updateHours(saloonId!, hours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saloon-detail', saloonId] })
      toast({ type: 'success', title: 'Hours updated' })
    },
    onError: () => toast({ type: 'error', title: 'Failed to update hours' }),
  })

  if (isLoading) return (
    <div className="p-4 lg:p-6 max-w-screen-lg space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )

  return (
    <div className="p-4 lg:p-6 max-w-screen-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Saloon</h1>
        {!editMode && <Button size="sm" variant="secondary" onClick={() => setEditMode(true)}>Edit details</Button>}
      </div>

      {/* Details card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        {editMode ? (
          <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Saloon name" {...register('name')} error={errors.name?.message} />
              <Input label="Phone" type="tel" {...register('phone')} />
              <Input label="Address" {...register('address')} error={errors.address?.message} />
              <Input label="City" {...register('city')} error={errors.city?.message} />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Timezone</label>
                <select {...register('timezone')} className="h-10 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
              <Input label="Instagram handle" {...register('instagram_handle')} placeholder="@yoursaloon" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Description</label>
              <textarea {...register('description')} rows={3} className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" type="button" onClick={() => setEditMode(false)}>Cancel</Button>
              <Button type="submit" loading={updateMutation.isPending} disabled={!isValid}>Save changes</Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Name', value: saloon?.name },
              { label: 'Phone', value: saloon?.phone ?? '—' },
              { label: 'Address', value: saloon?.address },
              { label: 'City', value: saloon?.city },
              { label: 'Timezone', value: saloon?.timezone },
              { label: 'Instagram', value: saloon?.instagram_handle ? `@${saloon.instagram_handle}` : '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="text-sm font-medium text-gray-900">{value}</p>
              </div>
            ))}
            {saloon?.description && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 mb-0.5">Description</p>
                <p className="text-sm text-gray-700">{saloon.description}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Working hours */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Opening hours</h2>
        <div className="space-y-2">
          {hours.map((row, i) => (
            <div key={row.weekday} className="flex items-center gap-3">
              <div className="w-28">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={row.is_open}
                    onChange={e => setHours(prev => prev.map((r, idx) => idx === i ? { ...r, is_open: e.target.checked } : r))}
                    className="rounded accent-brand-600"
                  />
                  <span className={`text-sm ${row.is_open ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{DAYS[row.weekday]}</span>
                </label>
              </div>
              {row.is_open ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={row.open_time}
                    onChange={e => setHours(prev => prev.map((r, idx) => idx === i ? { ...r, open_time: e.target.value } : r))}
                    className="h-8 rounded-lg border border-gray-200 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <span className="text-gray-400 text-sm">—</span>
                  <input
                    type="time"
                    value={row.close_time}
                    onChange={e => setHours(prev => prev.map((r, idx) => idx === i ? { ...r, close_time: e.target.value } : r))}
                    className="h-8 rounded-lg border border-gray-200 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              ) : (
                <span className="text-sm text-gray-400">Closed</span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button size="sm" loading={hoursMutation.isPending} onClick={() => hoursMutation.mutate()}>Save hours</Button>
        </div>
      </div>
    </div>
  )
}
