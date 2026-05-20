import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors, borderRadius, fontSize, spacing } from '@/theme'

type Status = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

interface BadgeProps {
  status: Status | string
  label?: string
}

const statusConfig: Record<Status, { bg: string; text: string; label: string }> = {
  pending: {
    bg: '#fef3c7',
    text: colors.amber500,
    label: 'Pending',
  },
  confirmed: {
    bg: colors.primaryLight,
    text: colors.primary,
    label: 'Confirmed',
  },
  completed: {
    bg: '#dcfce7',
    text: colors.green500,
    label: 'Completed',
  },
  cancelled: {
    bg: '#fee2e2',
    text: colors.red500,
    label: 'Cancelled',
  },
  no_show: {
    bg: colors.gray100,
    text: colors.gray600,
    label: 'No Show',
  },
}

export function Badge({ status, label }: BadgeProps) {
  const config = statusConfig[status as Status] ?? {
    bg: colors.gray100,
    text: colors.gray600,
    label: status,
  }

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{label ?? config.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 1,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
})
