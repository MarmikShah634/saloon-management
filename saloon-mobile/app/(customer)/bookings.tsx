import React, { useState } from 'react'
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { format, parseISO } from 'date-fns'
import { bookingsApi, type Booking } from '@/lib/api/endpoints'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/theme'

const UPCOMING_STATUSES = ['pending', 'confirmed']
const PAST_STATUSES = ['completed', 'cancelled', 'no_show']

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel?: () => void }) {
  const isUpcoming = UPCOMING_STATUSES.includes(booking.status)

  const formattedDate = (() => {
    try { return format(parseISO(booking.date), 'EEE, MMM d, yyyy') } catch { return booking.date }
  })()

  const formattedTime = (() => {
    try { return format(parseISO(booking.start_at), 'h:mm a') } catch { return booking.start_at }
  })()

  return (
    <Card style={styles.bookingCard} shadow="md">
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.saloonName}>{booking.saloon?.name ?? 'Saloon'}</Text>
          <Text style={styles.dateText}>{formattedDate} at {formattedTime}</Text>
        </View>
        <Badge status={booking.status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.servicesList}>
        {booking.items.map((item, idx) => (
          <View key={idx} style={styles.serviceRow}>
            <Text style={styles.serviceName}>{item.service_name_snapshot}</Text>
            <Text style={styles.servicePrice}>${item.price_snapshot}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalPrice}>${booking.total_price}</Text>
      </View>

      {isUpcoming && onCancel && (
        <Button
          variant="ghost"
          size="sm"
          style={styles.cancelButton}
          onPress={onCancel}
        >
          Cancel Booking
        </Button>
      )}
    </Card>
  )
}

export default function BookingsScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', 'mine'],
    queryFn: () => bookingsApi.listMine({ size: 50 }),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'mine'] })
    },
  })

  const upcoming = (data?.items ?? []).filter((b) => UPCOMING_STATUSES.includes(b.status))
  const past = (data?.items ?? []).filter((b) => PAST_STATUSES.includes(b.status))
  const displayItems = activeTab === 'upcoming' ? upcoming : past

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
              onPress={() => setActiveTab('upcoming')}
            >
              <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
                Upcoming ({upcoming.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'past' && styles.activeTab]}
              onPress={() => setActiveTab('past')}
            >
              <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
                Past ({past.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <Spinner />
      ) : (
        <FlatList
          data={displayItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={56} color={colors.gray400} />
              <Text style={styles.emptyTitle}>
                {activeTab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'upcoming' ? 'Book your next appointment' : 'Your completed bookings will appear here'}
              </Text>
              {activeTab === 'upcoming' && (
                <Button
                  variant="primary"
                  size="md"
                  onPress={() => router.push('/(customer)/explore')}
                  style={styles.bookButton}
                >
                  Find a Saloon
                </Button>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onCancel={
                UPCOMING_STATUSES.includes(item.status)
                  ? () => cancelMutation.mutate(item.id)
                  : undefined
              }
            />
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeTop: {
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 0,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  tab: {
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.base,
    color: colors.gray400,
    fontWeight: fontWeight.medium,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  bookingCard: {
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  saloonName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray900,
    marginBottom: 2,
  },
  dateText: {
    fontSize: fontSize.sm,
    color: colors.gray600,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray100,
  },
  servicesList: {
    gap: spacing.xs,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: fontSize.sm,
    color: colors.gray700,
  },
  servicePrice: {
    fontSize: fontSize.sm,
    color: colors.gray600,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  totalLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray900,
  },
  totalPrice: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  cancelButton: {
    marginTop: spacing.xs,
    borderColor: colors.red500,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray700,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray400,
    textAlign: 'center',
  },
  bookButton: {
    marginTop: spacing.sm,
  },
})
