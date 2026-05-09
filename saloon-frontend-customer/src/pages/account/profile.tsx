import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi, authApi } from '@/lib/api/endpoints'
import { Input, PasswordInput } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/lib/api/client'

const profileSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().optional(),
})

const passwordSchema = z.object({
  old_password: z.string().min(1),
  new_password: z.string().min(8),
  confirm: z.string(),
}).refine(d => d.new_password === d.confirm, { message: "Passwords don't match", path: ['confirm'] })

type ProfileData = z.infer<typeof profileSchema>
type PasswordData = z.infer<typeof passwordSchema>

export function ProfilePage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [showPwModal, setShowPwModal] = useState(false)

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: userApi.getMe })

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? '', phone: user?.phone ?? '' },
  })

  const pwForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) })

  const profileMutation = useMutation({
    mutationFn: (d: ProfileData) => userApi.updateMe(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast({ type: 'success', title: 'Profile updated' })
    },
    onError: () => toast({ type: 'error', title: 'Update failed' }),
  })

  const pwMutation = useMutation({
    mutationFn: (d: PasswordData) => authApi.changePassword(d.old_password, d.new_password),
    onSuccess: () => {
      setShowPwModal(false)
      pwForm.reset()
      toast({ type: 'success', title: 'Password changed' })
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to change password'
      pwForm.setError('root', { message: msg })
    },
  })

  return (
    <div className="max-w-screen-sm mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Profile</h1>

      <form
        onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))}
        className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4"
      >
        <Input
          label="Name"
          error={profileForm.formState.errors.name?.message}
          {...profileForm.register('name')}
        />
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
          <input
            type="email"
            value={user?.email ?? ''}
            disabled
            className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
        </div>
        <Input
          label="Phone"
          type="tel"
          error={profileForm.formState.errors.phone?.message}
          {...profileForm.register('phone')}
        />
        <Button
          type="submit"
          loading={profileMutation.isPending}
          disabled={!profileForm.formState.isDirty}
        >
          Save changes
        </Button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <button
          onClick={() => setShowPwModal(true)}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          Change password
        </button>
      </div>

      {/* Change password modal */}
      <Modal open={showPwModal} onClose={() => setShowPwModal(false)} title="Change password">
        <form
          onSubmit={pwForm.handleSubmit((d) => pwMutation.mutate(d))}
          className="space-y-4 mt-4"
        >
          {pwForm.formState.errors.root && (
            <p className="text-sm text-red-600">{pwForm.formState.errors.root.message}</p>
          )}
          <PasswordInput label="Current password" {...pwForm.register('old_password')} />
          <PasswordInput label="New password" error={pwForm.formState.errors.new_password?.message} {...pwForm.register('new_password')} />
          <PasswordInput label="Confirm new password" error={pwForm.formState.errors.confirm?.message} {...pwForm.register('confirm')} />
          <Button type="submit" className="w-full" loading={pwMutation.isPending}>
            Change password
          </Button>
        </form>
      </Modal>
    </div>
  )
}
