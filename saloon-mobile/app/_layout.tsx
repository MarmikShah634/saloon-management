import React, { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuthStore } from '@/lib/stores/auth.store'
import { authApi } from '@/lib/api/endpoints'
import { getAccessToken } from '@/lib/api/client'
import { Spinner } from '@/components/ui/Spinner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, isLoading } = useAuthStore()

  useEffect(() => {
    async function bootstrap() {
      setLoading(true)
      try {
        const token = await getAccessToken()
        if (token) {
          const user = await authApi.me()
          setUser(user)
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
  }, [setUser, setLoading])

  if (isLoading) {
    return <Spinner fullScreen />
  }

  return <>{children}</>
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  })

  if (!fontsLoaded) {
    return <Spinner fullScreen />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AuthBootstrap>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(customer)" />
            <Stack.Screen name="(barber)" />
            <Stack.Screen name="(owner)" />
          </Stack>
        </AuthBootstrap>
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}
