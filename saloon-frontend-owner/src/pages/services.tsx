import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { serviceApi } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Button, Input, Modal, Skeleton, useToast } from '@/components/ui/index'
import { formatPrice } from '@/lib/utils'
import type { Service } from '@/lib/api/endpoints'

const schema = z.object({
  name: z.string().min(1).max(120),
  duration_mins: z.coerce.number().int().min(5).max(480),
  price: z.coerce.number().min(0),
  category: z.string().optional(),
  deposit_pct: z.coerce.number().min(0).max(100).optional(),
})
type FormData = z.infer<typeof schema>

export function ServicesPage() {
  const { saloonId } = useAuthStore()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['services', saloonId],
    queryFn: () => serviceApi.list(saloonId!),
    enabled: !!saloonId,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: editing ? { name: editing.name, duration_mins: editing.duration_mins, price: parseFloat(editing.price), category: editing.category ?? '', deposit_pct: editing.deposit_pct } : undefined,
  })

  const createMutation = useMutation({
    mutationFn: (d: FormData) => serviceApi.create(saloonId!, { ...d, price: d.price }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['services'] }); setShowForm(false); reset(); toast({ type: 'success', title: 'Service created' }) },
    onError: () => toast({ type: 'error', title: 'Failed to create service' }),
  })

  const updateMutation = useMutation({
    mutationFn: (d: FormData) => serviceApi.update(editing!.id, { ...d, price: String(d.price) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['services'] }); setEditing(null); reset(); toast({ type: 'success', title: 'Service updated' }) },
  })

  const toggleMutation = useMutation({
    mutationFn: (svc: Service) => serviceApi.update(svc.id, { is_active: !svc.is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => serviceApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['services'] }); toast({ type: 'success', title: 'Service deleted' }) },
  })

  const services = data?.items ?? []

  function openCreate() { reset(); setEditing(null); setShowForm(true) }
  function openEdit(svc: Service) { setEditing(svc); setShowForm(true) }

  return (
    <div className="p-4 lg:p-6 max-w-screen-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" />Add service</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
      ) : services.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-3">No services yet</p>
          <Button variant="secondary" size="sm" onClick={openCreate}>Create your first service</Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {services.map((svc, i) => (
            <div key={svc.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-gray-50' : ''} ${!svc.is_active ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{svc.name}</p>
                <p className="text-xs text-gray-500">{svc.duration_mins} min · {formatPrice(svc.price)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleMutation.mutate(svc)} className="p-1.5 rounded-lg hover:bg-gray-100" aria-label={svc.is_active ? 'Deactivate' : 'Activate'}>
                  {svc.is_active ? <ToggleRight className="h-5 w-5 text-brand-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                </button>
                <button onClick={() => openEdit(svc)} className="p-1.5 rounded-lg hover:bg-gray-100" aria-label="Edit"><Pencil className="h-4 w-4 text-gray-500" /></button>
                <button onClick={() => { if (confirm('Delete this service?')) deleteMutation.mutate(svc.id) }} className="p-1.5 rounded-lg hover:bg-red-50" aria-label="Delete"><Trash2 className="h-4 w-4 text-red-500" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }} title={editing ? 'Edit service' : 'New service'}>
        <form onSubmit={handleSubmit(d => editing ? updateMutation.mutate(d) : createMutation.mutate(d))} className="space-y-3 mt-2">
          <Input label="Name" {...register('name')} error={errors.name?.message} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Duration (min)" type="number" {...register('duration_mins')} error={errors.duration_mins?.message} />
            <Input label="Price (₹)" type="number" step="0.01" {...register('price')} error={errors.price?.message} />
          </div>
          <Input label="Category (optional)" {...register('category')} />
          <Input label="Deposit %" type="number" min={0} max={100} {...register('deposit_pct')} />
          <Button type="submit" className="w-full" loading={createMutation.isPending || updateMutation.isPending}>
            {editing ? 'Update' : 'Create service'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
