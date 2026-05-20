import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { saloonApi } from '@/lib/api/endpoints'
import { Spinner } from '@/components/ui/Spinner'
import { colors, fontSize, spacing, borderRadius, shadows } from '@/theme'

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon as never} size={16} color={colors.primary} />
      </View>
      <View style={styles.infoBody}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  )
}

export default function OwnerSaloonScreen() {
  const { data: saloon, isLoading } = useQuery({
    queryKey: ['owner-saloon'],
    queryFn: () => saloonApi.getOwner(),
  })

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>My Saloon</Text>

        {isLoading ? <Spinner /> : !saloon ? (
          <View style={styles.empty}>
            <Ionicons name="storefront-outline" size={48} color={colors.gray200} />
            <Text style={styles.emptyText}>No saloon found</Text>
          </View>
        ) : (
          <>
            {/* Banner */}
            <View style={styles.banner}>
              <View style={styles.bannerIcon}>
                <Ionicons name="cut-outline" size={32} color={colors.white} />
              </View>
              <Text style={styles.saloonName}>{saloon.name}</Text>
              <View style={[styles.statusBadge, saloon.status === 'active' && styles.statusBadgeActive]}>
                <Text style={[styles.statusText, saloon.status === 'active' && styles.statusTextActive]}>
                  {saloon.status === 'active' ? 'Active' : saloon.status}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <InfoRow icon="location-outline" label="Address" value={`${saloon.address}, ${saloon.city}`} />
              <View style={styles.divider} />
              <InfoRow icon="call-outline" label="Phone" value={saloon.phone ?? 'Not set'} />
              <View style={styles.divider} />
              <InfoRow icon="time-outline" label="Timezone" value={saloon.timezone} />
              <View style={styles.divider} />
              <InfoRow icon="globe-outline" label="Slug" value={saloon.slug} />
            </View>

            <View style={styles.hint}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
              <Text style={styles.hintText}>Edit your saloon details from the Owner web portal.</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.gray50 },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 80 },
  title: { fontSize: fontSize['2xl'], fontFamily: 'Inter_700Bold', color: colors.textPrimary, marginBottom: spacing.lg },
  banner: { backgroundColor: '#1d4ed8', borderRadius: borderRadius.xl, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md, ...shadows.lg },
  bannerIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  saloonName: { fontSize: fontSize.xl, fontFamily: 'Inter_700Bold', color: colors.white, marginBottom: 8 },
  statusBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 4 },
  statusBadgeActive: { backgroundColor: 'rgba(34,197,94,0.25)' },
  statusText: { fontSize: fontSize.xs, fontFamily: 'Inter_600SemiBold', color: colors.white },
  statusTextActive: { color: '#86efac' },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.border, ...shadows.sm, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: 12 },
  infoIcon: { width: 36, height: 36, borderRadius: borderRadius.lg, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  infoBody: { flex: 1 },
  infoLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontFamily: 'Inter_500Medium' },
  infoValue: { fontSize: fontSize.base, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.gray100, marginLeft: 64 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.gray100, borderRadius: borderRadius.lg, padding: 12, marginTop: spacing.md },
  hintText: { flex: 1, fontSize: fontSize.sm, color: colors.textMuted },
  empty: { alignItems: 'center', paddingVertical: 64 },
  emptyText: { fontSize: fontSize.lg, color: colors.textMuted, marginTop: 12 },
})
