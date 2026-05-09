import { useForm, useFieldArray } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workingHoursApi } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Button, Input, useToast } from '@/components/ui/index'
import { weekdayName } from '@/lib/utils'

interface HoursForm {
  hours: Array<{ weekday: number; start_time: string; end_time: string; enabled: boolean }>
}

export function WorkingHoursPage() {
  const { barberId } = useAuthStore()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: existing } = useQuery({
    queryKey: ['working-hours', barberId],
    queryFn: () => workingHoursApi.list(barberId!),
    enabled: !!barberId,
  })

  const defaultHours = Array.from({ length: 7 }, (_, i) => {
    const existing_wh = existing?.find(w => w.weekday === i)
    return {
      weekday: i,
      start_time: existing_wh?.start_time ?? '09:00',
      end_time: existing_wh?.end_time ?? '17:00',
      enabled: !!existing_wh,
    }
  })

  const { register, handleSubmit, watch, control } = useForm<HoursForm>({
    values: { hours: defaultHours },
  })

  const hours = watch('hours')

  const mutation = useMutation({
    mutationFn: (data: HoursForm) =>
      workingHoursApi.set(barberId!, data.hours.filter(h => h.enabled).map(({ weekday, start_time, end_time }) => ({ weekday, start_time, end_time }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['working-hours'] })
      toast({ type: 'success', title: 'Schedule saved' })
    },
    onError: () => toast({ type: 'error', title: 'Failed to save schedule' }),
  })

  return (
    <div className="max-w-screen-sm mx-auto px-4 py-4">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Working hours</h1>
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-3">
        {hours.map((h, i) => (
          <div key={h.weekday} className={`bg-white rounded-2xl border p-4 ${h.enabled ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register(`hours.${i}.enabled`)} className="h-4 w-4 rounded" />
                <span className="font-medium text-gray-900">{weekdayName(h.weekday)}</span>
              </label>
            </div>
            {h.enabled && (
              <div className="flex items-center gap-3">
                <Input type="time" {...register(`hours.${i}.start_time`)} className="flex-1" />
                <span className="text-gray-400">to</span>
                <Input type="time" {...register(`hours.${i}.end_time`)} className="flex-1" />
              </div>
            )}
          </div>
        ))}
        <Button type="submit" className="w-full" loading={mutation.isPending}>Save schedule</Button>
      </form>
    </div>
  )
}
