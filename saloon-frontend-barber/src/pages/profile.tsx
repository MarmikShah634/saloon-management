import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi, userApi } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Button, Input, PasswordInput, Modal, useToast } from '@/components/ui/index'
import { useState } from 'react'

const schema = z.object({ name: z.string().min(2), phone: z.string().optional() })
const pwSchema = z.object({
  old_password: z.string().min(1),
  new_password: z.string().min(8),
  confirm: z.string(),
}).refine(d => d.new_password === d.confirm, { message: "Passwords don't match", path: ['confirm'] })

export function ProfilePage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showPw, setShowPw] = useState(false)

  const profileForm = useForm({ resolver: zodResolver(schema), values: { name: user?.name ?? '', phone: user?.phone ?? '' } })
  const pwForm = useForm({ resolver: zodResolver(pwSchema) })

  const profileMutation = useMutation({
    mutationFn: (d: { name: string; phone?: string }) => userApi.updateMe(d),
    onSuccess: () => toast({ type: 'success', title: 'Profile updated' }),
  })

  const pwMutation = useMutation({
    mutationFn: (d: { old_password: string; new_password: string }) => authApi.changePassword(d.old_password, d.new_password),
    onSuccess: () => { setShowPw(false); pwForm.reset(); toast({ type: 'success', title: 'Password changed' }) },
    onError: () => toast({ type: 'error', title: 'Incorrect current password' }),
  })

  async function handleLogout() {
    try { await authApi.logout() } catch { /* ignore */ }
    logout(); navigate('/auth/login')
  }

  return (
    <div className="max-w-screen-sm mx-auto px-4 py-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">My profile</h1>

      <form onSubmit={profileForm.handleSubmit(d => profileMutation.mutate(d))} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <Input label="Name" {...profileForm.register('name')} />
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
          <input value={user?.email ?? ''} disabled className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed" />
        </div>
        <Input label="Phone" type="tel" {...profileForm.register('phone')} />
        <Button type="submit" loading={profileMutation.isPending}>Save</Button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <button onClick={() => setShowPw(true)} className="text-sm font-medium text-brand-600">Change password</button>
        <div className="border-t border-gray-100 pt-3">
          <button onClick={handleLogout} className="text-sm font-medium text-red-600">Sign out</button>
        </div>
      </div>

      <Modal open={showPw} onClose={() => setShowPw(false)} title="Change password">
        <form onSubmit={pwForm.handleSubmit(d => pwMutation.mutate(d))} className="space-y-3 mt-3">
          <PasswordInput label="Current password" {...pwForm.register('old_password')} error={pwForm.formState.errors.old_password?.message} />
          <PasswordInput label="New password" {...pwForm.register('new_password')} error={pwForm.formState.errors.new_password?.message} />
          <PasswordInput label="Confirm" {...pwForm.register('confirm')} error={pwForm.formState.errors.confirm?.message} />
          <Button type="submit" className="w-full" loading={pwMutation.isPending}>Change password</Button>
        </form>
      </Modal>
    </div>
  )
}
