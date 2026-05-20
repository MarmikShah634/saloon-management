import React from 'react'
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { notificationsApi, authApi, type Notification } from '@/lib/api/endpoints'
import { useAuthStore } from '@/lib/stores/auth.store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/theme'

function NotificationItem({ item }: { item: Notification }) {
  const timeAgo = (() => {
    try { return formatDistanceToNow(parseISO(item.created_at), { addSuffix: true }) } catch { return '' }
  })()

  return (
    <View style={[styles.notifItem, !item.is_read && styles.notifUnread]}>
      <View style={[styles.notifDot, !item.is_read && styles.notifDotActive]} />
      <View style={styles.notifContent}>
        <Text style={styles.notifTitle}>{item.title}</Text>
        <Text style={styles.notifBody}>{item.body}</Text>
        <Text style={styles.notifTime}>{timeAgo}</Text>
      </View>
    </View>
  )
}

export default function ProfileScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, logout } = useAuthStore()

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list({ size: 10 }),
  })

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try { await authApi.logout() } catch { /* ignore */ }
          await logout()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* User info card */}
        <Card style={styles.profileCard} shadow="md">
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              {user?.phone && (
                <Text style={styles.userPhone}>{user.phone}</Text>
              )}
            </View>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role}</Text>
          </View>
        </Card>

        {/* Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Notifications</Text>
            {(notifData?.items.some((n) => !n.is_read)) && (
              <TouchableOpacity onPress={() => markAllReadMutation.mutate()}>
                <Text style={styles.markAllRead}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>

          <Card shadow="sm" padding={0}>
            {notifData?.items.length === 0 ? (
              <View style={styles.emptyNotif}>
                <Ionicons name="notifications-off-outline" size={32} color={colors.gray400} />
                <Text style={styles.emptyNotifText}>No notifications</Text>
              </View>
            ) : (
              notifData?.items.map((item) => (
                <NotificationItem key={item.id} item={item} />
              ))
            )}
          </Card>
        </View>

        {/* Menu items */}
        <View style={styles.section}>
          <Card shadow="sm" padding={0}>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="person-outline" size={20} color={colors.gray600} />
              <Text style={styles.menuItemText}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(customer)/bookings')}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.gray600} />
              <Text style={styles.menuItemText}>My Bookings</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="help-circle-outline" size={20} color={colors.gray600} />
              <Text style={styles.menuItemText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Sign out */}
        <View style={[styles.section, { paddingBottom: spacing.xl }]}>
          <Button variant="destructive" size="lg" fullWidth onPress={handleLogout}>
            Sign Out
          </Button>
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
  safeTop: {
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray900,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  profileCard: {
    margin: spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.gray900,
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.gray600,
  },
  userPhone: {
    fontSize: fontSize.sm,
    color: colors.gray400,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 2,
    borderRadius: borderRadius.full,
  },
  roleText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray900,
  },
  markAllRead: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  notifItem: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  notifUnread: {
    backgroundColor: colors.primaryLight,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray200,
    marginTop: 6,
  },
  notifDotActive: {
    backgroundColor: colors.primary,
  },
  notifContent: {
    flex: 1,
    gap: 2,
  },
  notifTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray900,
  },
  notifBody: {
    fontSize: fontSize.sm,
    color: colors.gray600,
    lineHeight: 20,
  },
  notifTime: {
    fontSize: fontSize.xs,
    color: colors.gray400,
    marginTop: 2,
  },
  emptyNotif: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyNotifText: {
    fontSize: fontSize.sm,
    color: colors.gray400,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  menuItemText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.gray700,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginLeft: spacing.md + 20 + spacing.md,
  },
})
