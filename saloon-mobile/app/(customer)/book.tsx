import React, { useState, useMemo } from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { format, addDays, parseISO } from 'date-fns'
import { saloonsApi, slotsApi, bookingsApi, type Service, type SlotOption } from '@/lib/api/endpoints'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/theme'

const STEPS = ['Services', 'Date', 'Time', 'Confirm']

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: total }).map((_, idx) => (
        <React.Fragment key={idx}>
          <View
            style={[
              styles.stepDot,
              idx <= current ? styles.stepDotActive : styles.stepDotInactive,
            ]}
          >
            {idx < current ? (
              <Ionicons name="checkmark" size={12} color={colors.white} />
            ) : (
              <Text style={[styles.stepNumber, idx <= current && styles.stepNumberActive]}>
                {idx + 1}
              </Text>
            )}
          </View>
          {idx < total - 1 && (
            <View style={[styles.stepLine, idx < current && styles.stepLineActive]} />
          )}
        </React.Fragment>
      ))}
    </View>
  )
}

export default function BookScreen() {
  const { saloonId } = useLocalSearchParams<{ saloonId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [step, setStep] = useState(0)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null)
  const [notes, setNotes] = useState('')

  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['saloon-services', saloonId],
    queryFn: () => saloonsApi.getServices(saloonId),
    enabled: !!saloonId,
  })

  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', saloonId, dateStr, selectedServices],
    queryFn: () =>
      slotsApi.any(saloonId, dateStr, selectedServices),
    enabled: step === 2 && selectedServices.length > 0 && !!saloonId,
  })

  const createMutation = useMutation({
    mutationFn: bookingsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'mine'] })
      Alert.alert('Booking Confirmed!', 'Your appointment has been booked successfully.', [
        { text: 'View Bookings', onPress: () => router.replace('/(customer)/bookings') },
        { text: 'Home', onPress: () => router.replace('/(customer)') },
      ])
    },
    onError: (error) => {
      Alert.alert('Booking Failed', (error as Error).message)
    },
  })

  const services = servicesData?.items.filter((s) => s.is_active) ?? []

  const selectedServiceObjects = services.filter((s) => selectedServices.includes(s.id))
  const totalPrice = selectedServiceObjects.reduce(
    (sum, s) => sum + parseFloat(s.price),
    0,
  )
  const totalDuration = selectedServiceObjects.reduce((sum, s) => sum + s.duration_mins, 0)

  const next7Days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(new Date(), i)),
    [],
  )

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
    setSelectedSlot(null)
  }

  const handleConfirm = () => {
    if (!selectedSlot) return
    createMutation.mutate({
      saloon_id: saloonId,
      barber_id: selectedSlot.barber_id,
      date: dateStr,
      start_at: selectedSlot.start_at,
      service_ids: selectedServices,
      customer_notes: notes || undefined,
    })
  }

  const canProceed = () => {
    if (step === 0) return selectedServices.length > 0
    if (step === 1) return true
    if (step === 2) return selectedSlot !== null
    return true
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose Services</Text>
            <Text style={styles.stepSubtitle}>Select one or more services</Text>
            {servicesLoading ? (
              <Spinner />
            ) : services.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cut-outline" size={40} color={colors.gray400} />
                <Text style={styles.emptyText}>No services available</Text>
              </View>
            ) : (
              <View style={styles.servicesList}>
                {services.map((service) => {
                  const isSelected = selectedServices.includes(service.id)
                  return (
                    <TouchableOpacity
                      key={service.id}
                      onPress={() => toggleService(service.id)}
                      activeOpacity={0.8}
                    >
                      <Card
                        style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
                        shadow="sm"
                      >
                        <View style={styles.serviceRow}>
                          <View style={styles.serviceCheckbox}>
                            {isSelected ? (
                              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                            ) : (
                              <Ionicons name="ellipse-outline" size={24} color={colors.gray300} />
                            )}
                          </View>
                          <View style={styles.serviceInfo}>
                            <Text style={[styles.serviceName, isSelected && styles.serviceNameSelected]}>
                              {service.name}
                            </Text>
                            <Text style={styles.serviceDuration}>{service.duration_mins} mins</Text>
                          </View>
                          <Text style={[styles.servicePrice, isSelected && styles.servicePriceSelected]}>
                            ${service.price}
                          </Text>
                        </View>
                      </Card>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}

            {selectedServices.length > 0 && (
              <Card style={styles.summaryCard} shadow="sm">
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.summaryDuration}>{totalDuration} mins</Text>
                </View>
                <Text style={styles.summaryPrice}>${totalPrice.toFixed(2)}</Text>
              </Card>
            )}
          </View>
        )

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose Date</Text>
            <Text style={styles.stepSubtitle}>Select your preferred date</Text>
            <View style={styles.datePicker}>
              {next7Days.map((date) => {
                const isSelected =
                  format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                return (
                  <TouchableOpacity
                    key={date.toISOString()}
                    style={[styles.dateButton, isSelected && styles.dateButtonSelected]}
                    onPress={() => {
                      setSelectedDate(date)
                      setSelectedSlot(null)
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[styles.dateDayName, isSelected && styles.dateTextSelected]}
                    >
                      {isToday ? 'Today' : format(date, 'EEE')}
                    </Text>
                    <Text
                      style={[styles.dateDay, isSelected && styles.dateTextSelected]}
                    >
                      {format(date, 'd')}
                    </Text>
                    <Text
                      style={[styles.dateMonth, isSelected && styles.dateTextSelected]}
                    >
                      {format(date, 'MMM')}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
            <Text style={styles.selectedDateText}>
              Selected: {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </Text>
          </View>
        )

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose Time</Text>
            <Text style={styles.stepSubtitle}>
              {format(selectedDate, 'EEEE, MMM d')} • {totalDuration} mins
            </Text>
            {slotsLoading ? (
              <Spinner />
            ) : !slots || slots.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={40} color={colors.gray400} />
                <Text style={styles.emptyText}>No slots available for this date</Text>
                <TouchableOpacity onPress={() => setStep(1)} style={styles.changeDateButton}>
                  <Text style={styles.changeDateText}>Change Date</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.slotGrid}>
                {slots.map((slot) => {
                  const isSelected = selectedSlot?.start_at === slot.start_at &&
                    selectedSlot?.barber_id === slot.barber_id
                  const timeStr = (() => {
                    try { return format(parseISO(slot.start_at), 'h:mm a') } catch { return slot.start_at }
                  })()
                  return (
                    <TouchableOpacity
                      key={`${slot.barber_id}-${slot.start_at}`}
                      style={[styles.slotButton, isSelected && styles.slotButtonSelected]}
                      onPress={() => setSelectedSlot(slot)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.slotTime, isSelected && styles.slotTimeSelected]}>
                        {timeStr}
                      </Text>
                      {slot.barber_name && (
                        <Text style={[styles.slotBarber, isSelected && styles.slotBarberSelected]}>
                          {slot.barber_name}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}
          </View>
        )

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Confirm Booking</Text>
            <Text style={styles.stepSubtitle}>Review your appointment details</Text>

            <Card style={styles.confirmCard} shadow="md">
              <View style={styles.confirmRow}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmLabel}>Date & Time</Text>
                  <Text style={styles.confirmValue}>
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </Text>
                  {selectedSlot && (
                    <Text style={styles.confirmValue}>
                      {(() => {
                        try { return format(parseISO(selectedSlot.start_at), 'h:mm a') } catch { return selectedSlot.start_at }
                      })()}
                      {' – '}
                      {(() => {
                        try { return format(parseISO(selectedSlot.end_at), 'h:mm a') } catch { return selectedSlot.end_at }
                      })()}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.confirmDivider} />

              <View style={styles.confirmRow}>
                <Ionicons name="cut-outline" size={20} color={colors.primary} />
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmLabel}>Services</Text>
                  {selectedServiceObjects.map((s) => (
                    <View key={s.id} style={styles.confirmServiceRow}>
                      <Text style={styles.confirmValue}>{s.name}</Text>
                      <Text style={styles.confirmServicePrice}>${s.price}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {selectedSlot?.barber_name && (
                <>
                  <View style={styles.confirmDivider} />
                  <View style={styles.confirmRow}>
                    <Ionicons name="person-outline" size={20} color={colors.primary} />
                    <View style={styles.confirmInfo}>
                      <Text style={styles.confirmLabel}>Barber</Text>
                      <Text style={styles.confirmValue}>{selectedSlot.barber_name}</Text>
                    </View>
                  </View>
                </>
              )}

              <View style={styles.confirmDivider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalPrice}>${totalPrice.toFixed(2)}</Text>
              </View>
            </Card>
          </View>
        )

      default:
        return null
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={colors.gray900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Appointment</Text>
          <View style={{ width: 40 }} />
        </View>
        <StepIndicator current={step} total={STEPS.length} />
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <SafeAreaView edges={['bottom']}>
          <View style={styles.footerButtons}>
            {step > 0 && (
              <Button
                variant="ghost"
                size="lg"
                onPress={() => setStep((s) => s - 1)}
                style={styles.backStepButton}
              >
                Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button
                variant="primary"
                size="lg"
                fullWidth={step === 0}
                style={step > 0 ? styles.nextButton : undefined}
                disabled={!canProceed()}
                onPress={() => setStep((s) => s + 1)}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                style={step > 0 ? styles.nextButton : undefined}
                loading={createMutation.isPending}
                onPress={handleConfirm}
              >
                Confirm Booking
              </Button>
            )}
          </View>
        </SafeAreaView>
      </View>
    </View>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styles: Record<string, any> = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeTop: {
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray900,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepDotInactive: {
    backgroundColor: colors.gray200,
  },
  stepNumber: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray400,
  },
  stepNumberActive: {
    color: colors.white,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.gray200,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  stepContent: {
    gap: spacing.md,
  },
  stepTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray900,
  },
  stepSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray600,
    marginTop: -spacing.sm,
  },
  servicesList: {
    gap: spacing.sm,
  },
  serviceCard: {
    padding: spacing.sm + 4,
  },
  serviceCardSelected: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  serviceCheckbox: {
    width: 24,
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
  serviceNameSelected: {
    color: colors.primaryDark,
  },
  serviceDuration: {
    fontSize: fontSize.xs,
    color: colors.gray400,
  },
  servicePrice: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.gray900,
  },
  servicePriceSelected: {
    color: colors.primary,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  summaryRow: {
    gap: spacing.xs,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primaryDark,
  },
  summaryDuration: {
    fontSize: fontSize.xs,
    color: colors.primary,
  },
  summaryPrice: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  datePicker: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dateButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    gap: 2,
  },
  dateButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateDayName: {
    fontSize: 9,
    fontWeight: fontWeight.medium,
    color: colors.gray400,
    textTransform: 'uppercase',
  },
  dateDay: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.gray900,
  },
  dateMonth: {
    fontSize: 9,
    color: colors.gray400,
  },
  dateTextSelected: {
    color: colors.white,
  },
  selectedDateText: {
    fontSize: fontSize.sm,
    color: colors.gray600,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  slotButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    alignItems: 'center',
    minWidth: 90,
  },
  slotButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotTime: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray900,
  },
  slotTimeSelected: {
    color: colors.white,
  },
  slotBarber: {
    fontSize: fontSize.xs,
    color: colors.gray400,
    marginTop: 1,
  },
  slotBarberSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  confirmCard: {
    gap: spacing.md,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  confirmInfo: {
    flex: 1,
    gap: spacing.xs - 2,
  },
  confirmLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  confirmValue: {
    fontSize: fontSize.sm,
    color: colors.gray900,
  },
  confirmServiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmServicePrice: {
    fontSize: fontSize.sm,
    color: colors.gray600,
  },
  confirmDivider: {
    height: 1,
    backgroundColor: colors.gray100,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray900,
  },
  totalPrice: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.gray600,
  },
  changeDateButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
  },
  changeDateText: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  backStepButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  gray300: colors.gray200,
})
