import React, { useState } from 'react'
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  Dimensions,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { saloonsApi } from '@/lib/api/endpoints'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/theme'

const { width } = Dimensions.get('window')

export default function SaloonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [photoIndex, setPhotoIndex] = useState(0)

  const { data: saloon, isLoading: saloonLoading } = useQuery({
    queryKey: ['saloon', id],
    queryFn: () => saloonsApi.get(id),
    enabled: !!id,
  })

  const { data: servicesData } = useQuery({
    queryKey: ['saloon-services', id],
    queryFn: () => saloonsApi.getServices(id),
    enabled: !!id,
  })

  const { data: barbersData } = useQuery({
    queryKey: ['saloon-barbers', id],
    queryFn: () => saloonsApi.getBarbers(id),
    enabled: !!id,
  })

  if (saloonLoading) return <Spinner fullScreen />

  if (!saloon) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.gray400} />
        <Text style={styles.errorText}>Saloon not found</Text>
        <Button variant="primary" size="md" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    )
  }

  const photos = saloon.photos ?? []

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo carousel */}
        <View style={styles.photoContainer}>
          {photos.length > 0 ? (
            <FlatList
              data={photos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, idx) => String(idx)}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / width)
                setPhotoIndex(idx)
              }}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.photo} />
              )}
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="cut" size={64} color={colors.primaryLight} />
            </View>
          )}

          {/* Back button overlay */}
          <SafeAreaView style={styles.backOverlay} edges={['top']}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={colors.white} />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Photo dots */}
          {photos.length > 1 && (
            <View style={styles.dots}>
              {photos.map((_, idx) => (
                <View
                  key={idx}
                  style={[styles.dot, idx === photoIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Saloon info */}
          <View style={styles.infoSection}>
            <Text style={styles.saloonName}>{saloon.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={colors.gray400} />
              <Text style={styles.locationText}>{saloon.city}</Text>
            </View>
            {saloon.address && (
              <View style={styles.locationRow}>
                <Ionicons name="map-outline" size={16} color={colors.gray400} />
                <Text style={styles.addressText}>{saloon.address}</Text>
              </View>
            )}
            {saloon.phone && (
              <View style={styles.locationRow}>
                <Ionicons name="call-outline" size={16} color={colors.gray400} />
                <Text style={styles.addressText}>{saloon.phone}</Text>
              </View>
            )}
          </View>

          {/* Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services</Text>
            {servicesData?.items.length === 0 ? (
              <Text style={styles.emptyText}>No services listed</Text>
            ) : (
              <View style={styles.servicesList}>
                {servicesData?.items.filter((s) => s.is_active).map((service) => (
                  <Card key={service.id} style={styles.serviceCard} shadow="sm">
                    <View style={styles.serviceRow}>
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        <Text style={styles.serviceDuration}>
                          {service.duration_mins} mins
                        </Text>
                      </View>
                      <Text style={styles.servicePrice}>${service.price}</Text>
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </View>

          {/* Barbers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Team</Text>
            {barbersData?.items.length === 0 ? (
              <Text style={styles.emptyText}>No barbers listed</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.barbersList}>
                  {barbersData?.items.map((barber) => (
                    <Card key={barber.id} style={styles.barberCard} shadow="sm">
                      <View style={styles.barberAvatar}>
                        <Ionicons name="person" size={28} color={colors.primary} />
                      </View>
                      <Text style={styles.barberName} numberOfLines={1}>
                        {(barber as any).user?.name ?? 'Barber'}
                      </Text>
                      <Text style={styles.barberServices}>
                        {barber.barber_services.length} services
                      </Text>
                    </Card>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>

          {/* Spacer for CTA */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Sticky Book Now button */}
      <View style={styles.bookingCTA}>
        <SafeAreaView edges={['bottom']}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={() =>
              router.push({
                pathname: '/(customer)/book',
                params: { saloonId: id },
              })
            }
          >
            Book Appointment
          </Button>
        </SafeAreaView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.gray600,
  },
  photoContainer: {
    height: 280,
    backgroundColor: colors.primaryLight,
    position: 'relative',
  },
  photo: {
    width,
    height: 280,
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  backOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  backButton: {
    margin: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    position: 'absolute',
    bottom: spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: colors.white,
    width: 16,
  },
  content: {
    flex: 1,
  },
  infoSection: {
    backgroundColor: colors.white,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  saloonName: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray900,
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationText: {
    fontSize: fontSize.base,
    color: colors.gray600,
    fontWeight: fontWeight.medium,
  },
  addressText: {
    fontSize: fontSize.sm,
    color: colors.gray600,
    flex: 1,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  servicesList: {
    gap: spacing.sm,
  },
  serviceCard: {
    padding: spacing.sm + 4,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceInfo: {
    flex: 1,
    gap: 2,
  },
  serviceName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.gray900,
  },
  serviceDuration: {
    fontSize: fontSize.xs,
    color: colors.gray400,
  },
  servicePrice: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  barbersList: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  barberCard: {
    width: 100,
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  barberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barberName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray900,
    textAlign: 'center',
  },
  barberServices: {
    fontSize: fontSize.xs,
    color: colors.gray400,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.gray400,
    fontStyle: 'italic',
  },
  bookingCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
})
