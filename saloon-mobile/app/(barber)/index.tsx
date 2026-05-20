import React, { useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { bookingsApi, type Booking } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from '@/theme'

function formatTime(isoStr: string) {
  try { return format(parseISO(isoStr), 'h:mm a') } catch { return isoStr }
}

function formatPrice(p: string) {
  const n = parseFloat(p)
  return isNaN(n) ? p : `₹${n.toFixed(0)}`
}

function BookingCard({ booking, onUpdateStatus }: { booking: Booking; onUpdateStatus: (id: string, status: string) => void }) {
  const isConfirmed = booking.status === 'confirmed'
  const isInProgress = booking.status === 'in_progress'
  const isDone = ['completed', 'cancelled', 'no_show'].includes(booking.status)

  function handleMore() {
    Alert.alert('Update Status', 'Choose action', [
      { text: 'Mark No-show', style: 'destructive', onPress: () => onUpdateStatus(booking.id, 'no_show') },
      { text: 'Cancel', style: 'destructive', onPress: () => onUpdateStatus(booking.id, 'cancelled') },
      { text: 'Dismiss', style: 'cancel' },
    ])
  }

  return (
    <View style={[styles.card, isInProgress && styles.cardActive, isDone && styles.cardDone]}>
      <View style={styles.cardHeader}>
        <View>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={styles.timeText}>{formatTime(booking.start_at)} → {formatTime(booking.end_at)}</Text>
          </View>
          <Text style={styles.customerName}>{booking.customer_notes ? '👤 Customer' : 'Customer'}</Text>
        </View>
        <Badge status={booking.status} />
      </View>

      <View style={styles.servicesRow}>
        {booking.items.map((item, i) => (
          <View key={i} style={styles.serviceTag}>
            <Text style={styles.serviceTagText}>{item.service_name_snapshot}</Text>
          </View>
        ))}
      </View>

      {booking.customer_notes ? (
        <View style={styles.notesBox}>
          <Text style={styles.notesText}>"{booking.customer_notes}"</Text>
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <Text style={styles.priceText}>{formatPrice(booking.total_price)}</Text>
        <View style={styles.actionRow}>
          {isConfirmed && (
            <Button title="Start" size="sm" onPress={() => onUpdateStatus(booking.id, 'in_progress')} />
          )}
          {isInProgress && (
            <Button title="Complete" size="sm" onPress={() => onUpdateStatus(booking.id, 'completed')} />
          )}
          {(isConfirmed || isInProgress) && (
            <Button title="More" size="sm" variant="ghost" onPress={handleMore} />
          )}
        </View>
      </View>
    </View>
  )
}

export default function TodayScreen() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [refreshing, setRefreshing] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['barber-bookings', today],
    queryFn: () => bookingsApi.list({ date_from: today, date_to: today, size: 50 }),
    refetchInterval: 60_000,
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => bookingsApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['barber-bookings'] }),
    onError: () => Alert.alert('Error', 'Could not update booking status.'),
  })

  async function onRefresh() {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const bookings = data?.items ?? []
  const active = bookings.filter(b => b.status === 'in_progress')
  const upcoming = bookings.filter(b => b.status === 'confirmed')
  const done = bookings.filter(b => ['completed', 'cancelled', 'no_show'].includes(b.status))
  const earned = done.filter(b => b.status === 'completed').reduce((s, b) => s + parseFloat(b.total_price), 0)

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Today</Text>
            <Text style={styles.subGreeting}>{format(new Date(), 'EEEE, MMMM d')}</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{bookings.length}</Text>
              <Text style={styles.statLabel}>bookings</Text>
            </View>
            {earned > 0 && (
              <View style={[styles.statPill, styles.statPillGreen]}>
                <Text style={[styles.statValue, { color: colors.green500 }]}>₹{earned.toFixed(0)}</Text>
                <Text style={[styles.statLabel, { color: '#15803d' }]}>earned</Text>
              </View>
            )}
          </View>
        </View>

        {isLoading && <Spinner />}

        {!isLoading && bookings.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={colors.gray200} />
            <Text style={styles.emptyTitle}>No bookings today</Text>
            <Text style={styles.emptySubtitle}>Enjoy the free time!</Text>
          </View>
        )}

        {active.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <View style={styles.activeDot} />
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>IN PROGRESS</Text>
            </View>
            {active.map(b => <BookingCard key={b.id} booking={b} onUpdateStatus={(id, s) => updateStatusMutation.mutate({ id, status: s })} />)}
          </View>
        )}

        {upcoming.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>UPCOMING · {upcoming.length}</Text>
            {upcoming.map(b => <BookingCard key={b.id} booking={b} onUpdateStatus={(id, s) => updateStatusMutation.mutate({ id, status: s })} />)}
          </View>
        )}

        {done.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, styles.sectionDone]}>DONE · {done.length}</Text>
            {done.map(b => <BookingCard key={b.id} booking={b} onUpdateStatus={(id, s) => updateStatusMutation.mutate({ id, status: s })} />)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.gray50 },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing['3xl'] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  greeting: { fontSize: fontSize['2xl'], fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  subGreeting: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statPill: { backgroundColor: colors.white, borderRadius: borderRadius.lg, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', ...shadows.sm },
  statPillGreen: { backgroundColor: '#f0fdf4' },
  statValue: { fontSize: fontSize.xl, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  statLabel: { fontSize: 10, color: colors.textMuted, fontFamily: 'Inter_600SemiBold' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  sectionTitle: { fontSize: fontSize.xs, fontFamily: 'Inter_700Bold', color: colors.textMuted, letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },
  sectionDone: { color: colors.gray200 },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.md, marginBottom: 12, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  cardActive: { borderColor: colors.primary, borderWidth: 1.5 },
  cardDone: { opacity: 0.7 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: fontSize.base, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  customerName: { fontSize: fontSize.sm, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary, marginTop: 4 },
  servicesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  serviceTag: { backgroundColor: '#ede9fe', borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 3 },
  serviceTagText: { fontSize: fontSize.xs, color: '#5b21b6', fontFamily: 'Inter_600SemiBold' },
  notesBox: { backgroundColor: '#fffbeb', borderRadius: borderRadius.md, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#fde68a' },
  notesText: { fontSize: fontSize.xs, color: '#92400e', fontStyle: 'italic' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceText: { fontSize: fontSize.base, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  actionRow: { flexDirection: 'row', gap: 8 },
  empty: { alignItems: 'center', paddingVertical: 64 },
  emptyTitle: { fontSize: fontSize.lg, fontFamily: 'Inter_700Bold', color: colors.textSecondary, marginTop: 16 },
  emptySubtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4 },
})
