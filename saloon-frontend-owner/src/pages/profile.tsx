import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { userApi } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Button, Input, PasswordInput, useToast } from '@/components/ui/index'

const profileSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().optional(),
})
type ProfileData = z.infer<typeof profileSchema>

const passwordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
  confirm: z.string(),
}).refine(d => d.new_password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })
type PasswordData = z.infer<typeof passwordSchema>

export function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const { toast } = useToast()

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? '', phone: user?.phone ?? '' },
  })
  const passwordForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) })

  const profileMutation = useMutation({
    mutationFn: (d: ProfileData) => userApi.updateMe(d),
    onSuccess: (u) => { updateUser(u); toast({ type: 'success', title: 'Profile updated' }) },
    onError: () => toast({ type: 'error', title: 'Failed to update profile' }),
  })

  const passwordMutation = useMutation({
    mutationFn: (d: PasswordData) => userApi.changePassword(d.current_password, d.new_password),
    onSuccess: () => { passwordForm.reset(); toast({ type: 'success', title: 'Password changed' }) },
    onError: () => { passwordForm.setError('current_password', { message: 'Current password is incorrect' }) },
  })

  return (
    <div className="p-4 lg:p-6 max-w-screen-sm space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Personal info</h2>
        <form onSubmit={profileForm.handleSubmit(d => profileMutation.mutate(d))} className="space-y-4">
          <Input label="Full name" {...profileForm.register('name')} error={profileForm.formState.errors.name?.message} />
          <Input label="Email" value={user?.email ?? ''} disabled />
          <Input label="Phone" type="tel" {...profileForm.register('phone')} />
          <Button type="submit" loading={profileMutation.isPending} disabled={!profileForm.formState.isValid}>Save changes</Button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Change password</h2>
        <form onSubmit={passwordForm.handleSubmit(d => passwordMutation.mutate(d))} className="space-y-4">
          <PasswordInput label="Current password" {...passwordForm.register('current_password')} error={passwordForm.formState.errors.current_password?.message} />
          <PasswordInput label="New password" {...passwordForm.register('new_password')} error={passwordForm.formState.errors.new_password?.message} />
          <PasswordInput label="Confirm new password" {...passwordForm.register('confirm')} error={passwordForm.formState.errors.confirm?.message} />
          <Button type="submit" loading={passwordMutation.isPending} disabled={!passwordForm.formState.isValid}>Change password</Button>
        </form>
      </div>
    </div>
  )
}
