import React from 'react'
import { StyleSheet, View, ViewProps } from 'react-native'
import { colors, borderRadius, spacing, shadows } from '@/theme'

interface CardProps extends ViewProps {
  padding?: number
  shadow?: 'sm' | 'md' | 'lg'
}

export function Card({ padding, shadow = 'md', style, children, ...rest }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        shadows[shadow],
        padding !== undefined ? { padding } : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
})
