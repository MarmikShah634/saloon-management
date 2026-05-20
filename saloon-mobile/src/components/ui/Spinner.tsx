import React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { colors } from '@/theme'

interface SpinnerProps {
  size?: 'small' | 'large'
  color?: string
  fullScreen?: boolean
}

export function Spinner({
  size = 'large',
  color = colors.primary,
  fullScreen = false,
}: SpinnerProps) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={color} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  )
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
