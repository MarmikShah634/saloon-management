import React from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { analyticsApi } from '@/lib/api/endpoints'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/theme'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: string
  iconColor: string
  iconBg: string
  trend?: { value: number; positive: boolean }
}

function MetricCard({ title, value, subtitle, icon, iconColor, iconBg, trend }: MetricCardProps) {
  return (
    <Card style={styles.metricCard} shadow="md">
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon as any} size={22} color={iconColor} />
        </View>
        {trend && (
          <View style={[styles.trendBadge, { backgroundColor: trend.positive ? '#dcfce7' : '#fee2e2' }]}>
            <Ionicons
              name={trend.positive ? 'trending-up' : 'trending-down'}
              size={12}
              color={trend.positive ? colors.green500 : colors.red500}
            />
            <Text style={[styles.trendText, { color: trend.positive ? '#15803d' : colors.red500 }]}>
              {trend.value}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </Card>
  )
}

export default function OwnerAnalyticsScreen() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: analyticsApi.ownerOverview,
  })

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>Business overview</Text>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <View style={styles.errorState}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.gray400} />
          <Text style={styles.errorText}>Failed to load analytics</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Revenue section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Revenue & Bookings</Text>
            <View style={styles.metricsGrid}>
              <MetricCard
                title="Total Revenue"
                value={`$${(data?.revenue ?? 0).toFixed(2)}`}
                icon="cash-outline"
                iconColor={colors.green500}
                iconBg="#dcfce7"
              />
              <MetricCard
                title="Total Bookings"
                value={data?.total_bookings ?? 0}
                icon="calendar"
                iconColor={colors.primary}
                iconBg={colors.primaryLight}
              />
            </View>
          </View>

          {/* Team & Status section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Team & Status</Text>
            <View style={styles.metricsGrid}>
              <MetricCard
                title="Active Barbers"
                value={data?.active_barbers ?? 0}
                icon="people-outline"
                iconColor="#0891b2"
                iconBg="#e0f2fe"
              />
              <MetricCard
                title="Pending"
                value={data?.pending_bookings ?? 0}
                icon="hourglass-outline"
                iconColor={colors.amber500}
                iconBg="#fef3c7"
              />
            </View>
          </View>

          {/* Completion stats */}
          {(data?.completed_bookings !== undefined || data?.cancelled_bookings !== undefined) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Booking Outcomes</Text>
              <Card shadow="md">
                <View style={styles.outcomeRow}>
                  <View style={[styles.outcomeIcon, { backgroundColor: '#dcfce7' }]}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.green500} />
                  </View>
                  <View style={styles.outcomeInfo}>
                    <Text style={styles.outcomeLabel}>Completed</Text>
                    <Text style={styles.outcomeValue}>{data?.completed_bookings ?? 0}</Text>
                  </View>
                  {data?.total_bookings ? (
                    <Text style={styles.outcomePercent}>
                      {Math.round(((data?.completed_bookings ?? 0) / data.total_bookings) * 100)}%
                    </Text>
                  ) : null}
                </View>

                <View style={styles.outcomeDivider} />

                <View style={styles.outcomeRow}>
                  <View style={[styles.outcomeIcon, { backgroundColor: '#fee2e2' }]}>
                    <Ionicons name="close-circle" size={20} color={colors.red500} />
                  </View>
                  <View style={styles.outcomeInfo}>
                    <Text style={styles.outcomeLabel}>Cancelled</Text>
                    <Text style={styles.outcomeValue}>{data?.cancelled_bookings ?? 0}</Text>
                  </View>
                  {data?.total_bookings ? (
                    <Text style={[styles.outcomePercent, { color: colors.red500 }]}>
                      {Math.round(((data?.cancelled_bookings ?? 0) / data.total_bookings) * 100)}%
                    </Text>
                  ) : null}
                </View>
              </Card>
            </View>
          )}

          {/* Avg revenue per booking */}
          {data?.total_bookings && data.total_bookings > 0 && (
            <View style={styles.section}>
              <Card style={styles.avgCard} shadow="md">
                <View style={styles.avgContent}>
                  <Ionicons name="analytics-outline" size={32} color={colors.primary} />
                  <View>
                    <Text style={styles.avgValue}>
                      ${((data?.revenue ?? 0) / data.total_bookings).toFixed(2)}
                    </Text>
                    <Text style={styles.avgLabel}>Avg. Revenue per Booking</Text>
                  </View>
                </View>
              </Card>
            </View>
          )}
        </ScrollView>
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
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray900,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray400,
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  section: {
    padding: spacing.md,
    paddingBottom: 0,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    gap: spacing.xs,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  trendText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
  },
  metricValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray900,
  },
  metricTitle: {
    fontSize: fontSize.xs,
    color: colors.gray400,
    fontWeight: fontWeight.medium,
  },
  metricSubtitle: {
    fontSize: fontSize.xs,
    color: colors.gray400,
  },
  outcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
  },
  outcomeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outcomeInfo: {
    flex: 1,
    gap: 2,
  },
  outcomeLabel: {
    fontSize: fontSize.xs,
    color: colors.gray400,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  outcomeValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray900,
  },
  outcomePercent: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.green500,
  },
  outcomeDivider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginHorizontal: spacing.sm,
  },
  avgCard: {
  },
  avgContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avgValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  avgLabel: {
    fontSize: fontSize.sm,
    color: colors.gray600,
    marginTop: 2,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.gray600,
  },
})
