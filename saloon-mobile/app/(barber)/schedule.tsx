import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { workingHoursApi, type WorkingHours } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Spinner } from '@/components/ui/Spinner'
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from '@/theme'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatTime12(t: string) {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export default function ScheduleScreen() {
  const { user } = useAuthStore()

  // For now we'll use a placeholder query — in production pass the barber ID
  const { data: hours, isLoading } = useQuery({
    queryKey: ['working-hours'],
    queryFn: () => workingHoursApi.list('me'),
    enabled: !!user,
  })

  const byDay: Record<number, WorkingHours> = {}
  hours?.forEach(h => { byDay[h.weekday] = h })

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>My Schedule</Text>
        <Text style={styles.subtitle}>Your working hours for the week</Text>

        {isLoading ? <Spinner /> : (
          <View style={styles.grid}>
            {[1, 2, 3, 4, 5, 6, 0].map(day => {
              const h = byDay[day]
              const today = new Date().getDay() === day
              return (
                <View key={day} style={[styles.dayCard, today && styles.dayCardToday]}>
                  <View style={[styles.dayBadge, today && styles.dayBadgeToday]}>
                    <Text style={[styles.dayShort, today && styles.dayShortToday]}>{SHORT_DAYS[day]}</Text>
                  </View>
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayName}>{DAYS[day]}</Text>
                    {h ? (
                      <View style={styles.hoursRow}>
                        <Ionicons name="time-outline" size={12} color={colors.primary} />
                        <Text style={styles.hoursText}>{formatTime12(h.start_time)} – {formatTime12(h.end_time)}</Text>
                      </View>
                    ) : (
                      <Text style={styles.offText}>Day off</Text>
                    )}
                  </View>
                  {h && (
                    <View style={styles.dotActive} />
                  )}
                </View>
              )
            })}
          </View>
        )}

        <View style={styles.editHint}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
          <Text style={styles.editHintText}>Edit working hours from the web portal</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.gray50 },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing['3xl'] },
  title: { fontSize: fontSize['2xl'], fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4, marginBottom: spacing.lg },
  grid: { gap: 10 },
  dayCard: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  dayCardToday: { borderColor: colors.primary, borderWidth: 1.5 },
  dayBadge: { width: 44, height: 44, borderRadius: borderRadius.lg, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  dayBadgeToday: { backgroundColor: colors.primary },
  dayShort: { fontSize: fontSize.sm, fontFamily: 'Inter_700Bold', color: colors.textSecondary },
  dayShortToday: { color: colors.white },
  dayInfo: { flex: 1 },
  dayName: { fontSize: fontSize.base, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  hoursText: { fontSize: fontSize.sm, color: colors.primary, fontFamily: 'Inter_500Medium' },
  offText: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  dotActive: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  editHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.lg, backgroundColor: colors.gray100, borderRadius: borderRadius.lg, padding: 12 },
  editHintText: { fontSize: fontSize.sm, color: colors.textMuted, flex: 1 },
})
