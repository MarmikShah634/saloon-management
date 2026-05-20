import React, { useState } from 'react'
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { saloonsApi, type Saloon } from '@/lib/api/endpoints'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/theme'

function SaloonListCard({ item, onPress }: { item: Saloon; onPress: () => void }) {
  const photo = item.photos?.[0]

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card style={styles.card} shadow="md">
        <View style={styles.cardRow}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.cardImage} />
          ) : (
            <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
              <Ionicons name="cut" size={24} color={colors.primaryLight} />
            </View>
          )}
          <View style={styles.cardContent}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.gray400} />
              <Text style={styles.locationText}>{item.city}</Text>
            </View>
            {item.address && (
              <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
            )}
            <View style={styles.bookRow}>
              <View style={[styles.statusDot, { backgroundColor: item.status === 'active' ? colors.green500 : colors.gray400 }]} />
              <Text style={styles.statusText}>{item.status === 'active' ? 'Open' : item.status}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
        </View>
      </Card>
    </TouchableOpacity>
  )
}

export default function ExploreScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ q?: string }>()
  const [search, setSearch] = useState(params.q ?? '')
  const [city, setCity] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState(params.q ?? '')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['saloons', 'list', debouncedSearch, city],
    queryFn: () => saloonsApi.list({ q: debouncedSearch || undefined, city: city || undefined, size: 30 }),
  })

  const handleSearchChange = (text: string) => {
    setSearch(text)
    clearTimeout((handleSearchChange as any)._timer)
    ;(handleSearchChange as any)._timer = setTimeout(() => {
      setDebouncedSearch(text)
    }, 400)
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore Saloons</Text>
          <View style={styles.searchRow}>
            <View style={styles.searchInput}>
              <Input
                placeholder="Search saloons..."
                value={search}
                onChangeText={handleSearchChange}
                leftIcon={<Ionicons name="search-outline" size={18} color={colors.gray400} />}
                containerStyle={{ marginBottom: 0 }}
              />
            </View>
            <View style={styles.cityInput}>
              <Input
                placeholder="City"
                value={city}
                onChangeText={setCity}
                containerStyle={{ marginBottom: 0 }}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <View style={styles.errorState}>
          <Ionicons name="wifi-outline" size={48} color={colors.gray400} />
          <Text style={styles.errorTitle}>Couldn't load saloons</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data?.items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={48} color={colors.gray400} />
              <Text style={styles.emptyTitle}>No saloons found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search</Text>
            </View>
          }
          renderItem={({ item }) => (
            <SaloonListCard
              item={item}
              onPress={() =>
                router.push({ pathname: '/(customer)/saloon/[id]', params: { id: item.id } })
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
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  searchInput: {
    flex: 3,
  },
  cityInput: {
    flex: 1.5,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  card: {
    marginBottom: 0,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardImage: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.lg,
  },
  cardImagePlaceholder: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 3,
  },
  cardName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray900,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locationText: {
    fontSize: fontSize.sm,
    color: colors.gray600,
  },
  addressText: {
    fontSize: fontSize.xs,
    color: colors.gray400,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: fontSize.xs,
    color: colors.gray600,
    fontWeight: fontWeight.medium,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  errorTitle: {
    fontSize: fontSize.lg,
    color: colors.gray600,
  },
  retryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  retryText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray700,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray400,
  },
})
