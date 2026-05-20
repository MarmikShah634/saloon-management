import React from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, fontSize, fontWeight, spacing } from '@/theme'

interface ScreenProps {
  children: React.ReactNode
  title?: string
  scrollable?: boolean
  padding?: boolean
  backgroundColor?: string
  keyboardAvoiding?: boolean
}

export function Screen({
  children,
  title,
  scrollable = false,
  padding = true,
  backgroundColor = colors.background,
  keyboardAvoiding = false,
}: ScreenProps) {
  const content = (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]} edges={['bottom']}>
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      {scrollable ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[padding && styles.paddedContent]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.body, padding && styles.paddedContent]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  )

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {content}
      </KeyboardAvoidingView>
    )
  }

  return <View style={[styles.flex, { backgroundColor }]}>{content}</View>
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray900,
  },
  scroll: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  paddedContent: {
    padding: spacing.md,
  },
})
