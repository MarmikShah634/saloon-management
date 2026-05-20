import React from 'react'
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { saloonsApi } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Card } from '@/components/ui/Card'
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from '@/theme'

const SERVICE_CATEGORIES = [
  { label: 'Haircut', icon: 'cut-outline' as const, color: '#7c3aed' },
  { label: 'Beard', icon: 'man-outline' as const, color: '#0891b2' },
  { label: 'Color', icon: 'color-palette-outline' as const, color: '#d97706' },
  { label: 'Spa', icon: 'flower-outline' as const, color: '#059669' },
]

function SaloonCard({ item, onPress }: { item: ReturnType<typeof saloonsApi.list> extends Promise<{ items: infer T[] }> ? T : any; onPress: () => void }) {
  const photo = item.photos?.[0]

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card style={styles.saloonCard} shadow="md">
        {photo ? (
          <Image source={{ uri: photo }} style={styles.saloonImage} />
        ) : (
          <View style={[styles.saloonImage, styles.saloonImagePlaceholder]}>
            <Ionicons name="cut" size={32} color={colors.primaryLight} />
          </View>
        )}
        <View style={styles.saloonInfo}>
          <Text style={styles.saloonName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.saloonLocation}>
            <Ionicons name="location-outline" size={12} color={colors.gray400} />
            <Text style={styles.saloonCity}>{item.city}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  )
}

function SkeletonCard() {
  return (
    <View style={[styles.saloonCard, styles.skeleton]}>
      <View style={[styles.saloonImage, { backgroundColor: colors.gray100 }]} />
      <View style={{ padding: spacing.sm }}>
        <View style={[styles.skeletonLine, { width: '70%' }]} />
        <View style={[styles.skeletonLine, { width: '40%', marginTop: spacing.xs }]} />
      </View>
    </View>
  )
}

export default function CustomerHomeScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  const { data: saloonsData, isLoading } = useQuery({
    queryKey: ['saloons', 'popular'],
    queryFn: () => saloonsApi.list({ size: 10 }),
  })

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>{firstName} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.notifButton}
            onPress={() => router.push('/(customer)/profile')}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/(customer)/explore')}
          activeOpacity={0.8}
        >
          <Ionicons name="search-outline" size={18} color={colors.gray400} />
          <Text style={styles.searchText}>Search saloons, services...</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Browse by service */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Service</Text>
          <View style={styles.categoryGrid}>
            {SERVICE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.label}
                style={styles.categoryItem}
                onPress={() => router.push({ pathname: '/(customer)/explore', params: { q: cat.label } })}
                activeOpacity={0.8}
              >
                <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                  <Ionicons name={cat.icon} size={28} color={cat.color} />
                </View>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular saloons */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Saloons</Text>
            <TouchableOpacity onPress={() => router.push('/(customer)/explore')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </ScrollView>
          ) : saloonsData?.items.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={40} color={colors.gray400} />
              <Text style={styles.emptyText}>No saloons found nearby</Text>
            </View>
          ) : (
            <FlatList
              data={saloonsData?.items}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.horizontalListContent}
              renderItem={({ item }) => (
                <SaloonCard
                  item={item}
                  onPress={() => router.push({ pathname: '/(customer)/saloon/[id]', params: { id: item.id } })}
                />
              )}
            />
          )}
        </View>

        {/* Quick booking CTA */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.ctaBanner}
            onPress={() => router.push('/(customer)/explore')}
            activeOpacity={0.9}
          >
            <View>
              <Text style={styles.ctaTitle}>Ready for a fresh look?</Text>
              <Text style={styles.ctaSubtitle}>Book your appointment now</Text>
            </View>
            <View style={styles.ctaButton}>
              <Ionicons name="arrow-forward" size={20} color={colors.white} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSafe: {
    backgroundColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  greeting: {
    fontSize: fontSize.base,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.xl,
    gap: spacing.sm,
    ...shadows.md,
  },
  searchText: {
    fontSize: fontSize.base,
    color: colors.gray400,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  seeAll: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  categoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryItem: {
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  categoryLabel: {
    fontSize: fontSize.sm,
    color: colors.gray700,
    fontWeight: fontWeight.medium,
  },
  horizontalList: {
    marginLeft: -spacing.md,
  },
  horizontalListContent: {
    paddingLeft: spacing.md,
    gap: spacing.md,
  },
  saloonCard: {
    width: 180,
    padding: 0,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  saloonImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  saloonImagePlaceholder: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saloonInfo: {
    padding: spacing.sm,
  },
  saloonName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray900,
    marginBottom: spacing.xs - 2,
  },
  saloonLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  saloonCity: {
    fontSize: fontSize.xs,
    color: colors.gray400,
  },
  skeleton: {
    ...shadows.md,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.gray400,
  },
  ctaBanner: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.md + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.xl,
  },
  ctaTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  ctaButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
