import React from 'react'
import { ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO, subDays } from 'date-fns'
import { analyticsApi, bookingsApi } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { colors, fontSize, spacing, borderRadius, shadows } from '@/theme'

function StatCard({ label, value, icon, color, bg }: { label: string; value: string | number; icon: string; color: string; bg: string }) {
  return (
    <View style={[styles.statCard, { borderColor: `${color}25` }]}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon as never} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function formatPrice(p: string | number) {
  const n = parseFloat(String(p))
  return isNaN(n) ? String(p) : `₹${n.toFixed(0)}`
}

export default function OwnerDashboard() {
  const { user } = useAuthStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['owner-analytics'],
    queryFn: () => analyticsApi.ownerOverview({ date_from: thirtyDaysAgo, date_to: today }),
  })

  const { data: recentBookings, isLoading: bookingsLoading, refetch } = useQuery({
    queryKey: ['owner-recent-bookings'],
    queryFn: () => bookingsApi.list({ page: 1, size: 6 }),
  })

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#2563eb" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Dashboard</Text>
            <Text style={styles.subGreeting}>Last 30 days</Text>
          </View>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() ?? 'O'}</Text>
          </View>
        </View>

        {/* Stats grid */}
        {analyticsLoading ? <Spinner /> : (
          <View style={styles.statsGrid}>
            <StatCard label="Total Bookings" value={analytics?.total_bookings ?? 0} icon="calendar-outline" color="#2563eb" bg="#dbeafe" />
            <StatCard label="Completed" value={analytics?.completed_bookings ?? 0} icon="checkmark-circle-outline" color="#16a34a" bg="#dcfce7" />
            <StatCard label="Revenue" value={formatPrice(String(analytics?.revenue ?? 0))} icon="cash-outline" color="#7c3aed" bg="#ede9fe" />
            <StatCard label="Barbers" value={analytics?.active_barbers ?? 0} icon="people-outline" color="#0891b2" bg="#cffafe" />
          </View>
        )}

        {/* Recent bookings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          {bookingsLoading ? (
            <Spinner />
          ) : recentBookings?.items.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={40} color={colors.gray200} />
              <Text style={styles.emptyText}>No bookings yet</Text>
            </View>
          ) : (
            recentBookings?.items.map(b => (
              <View key={b.id} style={styles.bookingRow}>
                <View style={styles.bookingLeft}>
                  <Text style={styles.bookingCustomer}>{b.customer_notes ?? 'Customer'}</Text>
                  <Text style={styles.bookingDate}>{format(parseISO(b.start_at), 'MMM d · h:mm a')}</Text>
                </View>
                <View style={styles.bookingRight}>
                  <Text style={styles.bookingPrice}>{formatPrice(b.total_price)}</Text>
                  <Badge status={b.status} />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.gray50 },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 80 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  greeting: { fontSize: fontSize['2xl'], fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  subGreeting: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  avatarBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  avatarText: { fontSize: fontSize.lg, fontFamily: 'Inter_700Bold', color: colors.white },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.lg },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.md, borderWidth: 1, ...shadows.sm },
  statIcon: { width: 36, height: 36, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: fontSize['2xl'], fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, fontFamily: 'Inter_500Medium' },
  section: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  sectionTitle: { fontSize: fontSize.base, fontFamily: 'Inter_700Bold', color: colors.textPrimary, marginBottom: spacing.md },
  bookingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  bookingLeft: { flex: 1 },
  bookingCustomer: { fontSize: fontSize.sm, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  bookingDate: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  bookingRight: { alignItems: 'flex-end', gap: 4 },
  bookingPrice: { fontSize: fontSize.sm, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 8 },
})
