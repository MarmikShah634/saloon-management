import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { colors, borderRadius, fontSize, fontWeight, spacing } from '@/theme'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends TouchableOpacityProps {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children?: React.ReactNode
  title?: string
  fullWidth?: boolean
}

const variantStyles: Record<Variant, { container: object; text: object }> = {
  primary: {
    container: {
      backgroundColor: colors.primary,
    },
    text: {
      color: colors.white,
    },
  },
  secondary: {
    container: {
      backgroundColor: colors.primaryLight,
    },
    text: {
      color: colors.primary,
    },
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.gray200,
    },
    text: {
      color: colors.gray700,
    },
  },
  destructive: {
    container: {
      backgroundColor: colors.red500,
    },
    text: {
      color: colors.white,
    },
  },
}

const sizeStyles: Record<Size, { container: object; text: object }> = {
  sm: {
    container: {
      paddingHorizontal: spacing.sm + 4,
      paddingVertical: spacing.xs + 2,
      borderRadius: borderRadius.md,
    },
    text: {
      fontSize: fontSize.sm,
    },
  },
  md: {
    container: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: borderRadius.lg,
    },
    text: {
      fontSize: fontSize.base,
    },
  },
  lg: {
    container: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 6,
      borderRadius: borderRadius.xl,
    },
    text: {
      fontSize: fontSize.lg,
    },
  },
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  title,
  fullWidth = false,
  onPress,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const label = children ?? title
  const handlePress = async (event: Parameters<NonNullable<TouchableOpacityProps['onPress']>>[0]) => {
    if (disabled || loading) return
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } catch {
      // Haptics not available
    }
    onPress?.(event)
  }

  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        variantStyles[variant].container,
        sizeStyles[size].container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'destructive' ? colors.white : colors.primary}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text
            style={[
              styles.text,
              variantStyles[variant].text,
              sizeStyles[size].text,
            ]}
          >
            {label}
          </Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: spacing.xs,
  },
  rightIcon: {
    marginLeft: spacing.xs,
  },
})
