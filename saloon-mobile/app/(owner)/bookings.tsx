import React, { useState } from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { bookingsApi, type Booking } from '@/lib/api/endpoints'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { colors, fontSize, spacing, borderRadius, shadows } from '@/theme'

const STATUSES = ['', 'confirmed', 'completed', 'cancelled']
const LABELS: Record<string, string> = { '': 'All', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled' }

function formatDateTime(s: string) {
  try { return format(parseISO(s), 'MMM d · h:mm a') } catch { return s }
}
function formatPrice(p: string) {
  const n = parseFloat(p); return isNaN(n) ? p : `₹${n.toFixed(0)}`
}

function BookingItem({ item }: { item: Booking }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.customer}>{item.customer_notes ?? 'Customer'}</Text>
          <Text style={styles.datetime}>{formatDateTime(item.start_at)}</Text>
        </View>
        <Badge status={item.status} />
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.servicesRow}>
          {item.items.slice(0, 2).map((s, i) => (
            <View key={i} style={styles.serviceTag}>
              <Text style={styles.serviceTagText}>{s.service_name_snapshot}</Text>
            </View>
          ))}
          {item.items.length > 2 && <Text style={styles.moreText}>+{item.items.length - 2} more</Text>}
        </View>
        <Text style={styles.price}>{formatPrice(item.total_price)}</Text>
      </View>
    </View>
  )
}

export default function OwnerBookingsScreen() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['owner-bookings', status, page],
    queryFn: () => bookingsApi.list({ status: status || undefined, page, size: 20 }),
  })

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Bookings</Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {STATUSES.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.filterTab, status === s && styles.filterTabActive]}
            onPress={() => { setStatus(s); setPage(1) }}
          >
            <Text style={[styles.filterLabel, status === s && styles.filterLabelActive]}>{LABELS[s]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? <Spinner /> : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#2563eb" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color={colors.gray200} />
              <Text style={styles.emptyText}>No bookings found</Text>
            </View>
          }
          renderItem={({ item }) => <BookingItem item={item} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.gray50 },
  header: { padding: spacing.md, paddingBottom: 8 },
  title: { fontSize: fontSize['2xl'], fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: 8, marginBottom: 8 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  filterTabActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filterLabel: { fontSize: fontSize.sm, fontFamily: 'Inter_500Medium', color: colors.textMuted },
  filterLabelActive: { color: colors.white, fontFamily: 'Inter_600SemiBold' },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  customer: { fontSize: fontSize.base, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  datetime: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  servicesRow: { flexDirection: 'row', gap: 6, flex: 1 },
  serviceTag: { backgroundColor: colors.gray100, borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  serviceTagText: { fontSize: fontSize.xs, color: colors.textSecondary },
  moreText: { fontSize: fontSize.xs, color: colors.textMuted, alignSelf: 'center' },
  price: { fontSize: fontSize.sm, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  empty: { alignItems: 'center', paddingVertical: 64 },
  emptyText: { fontSize: fontSize.lg, color: colors.textMuted, marginTop: 12 },
})
