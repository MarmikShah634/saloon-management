import { Redirect } from 'expo-router'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Spinner } from '@/components/ui/Spinner'

export default function Index() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return <Spinner fullScreen />
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />
  }

  switch (user.role) {
    case 'customer':
      return <Redirect href="/(customer)" />
    case 'barber':
      return <Redirect href="/(barber)" />
    case 'owner':
      return <Redirect href="/(owner)" />
    default:
      return <Redirect href="/(auth)/login" />
  }
}
