import React from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { notificationsApi, type Notification } from '@/lib/api/endpoints'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { colors, fontSize, spacing, borderRadius, shadows } from '@/theme'

function NotifItem({ item }: { item: Notification }) {
  const timeAgo = (() => {
    try { return formatDistanceToNow(parseISO(item.created_at), { addSuffix: true }) } catch { return '' }
  })()

  return (
    <View style={[styles.notifCard, !item.is_read && styles.notifUnread]}>
      <View style={[styles.dot, !item.is_read && styles.dotActive]} />
      <View style={styles.notifBody}>
        <Text style={styles.notifTitle}>{item.title}</Text>
        <Text style={styles.notifText}>{item.body}</Text>
        <Text style={styles.notifTime}>{timeAgo}</Text>
      </View>
    </View>
  )
}

export default function NotificationsScreen() {
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list({ size: 30 }),
  })

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const items = data?.items ?? []
  const unread = items.filter(n => !n.is_read).length

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unread > 0 && (
          <Button title="Mark all read" size="sm" variant="ghost" onPress={() => markAllMutation.mutate()} loading={markAllMutation.isPending} />
        )}
      </View>
      {isLoading ? <Spinner /> : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.gray200} />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
            </View>
          }
          renderItem={({ item }) => <NotifItem item={item} />}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.gray50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: fontSize['2xl'], fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  notifCard: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.md, flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: colors.border, ...shadows.sm },
  notifUnread: { borderColor: '#c4b5fd', backgroundColor: '#faf5ff' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gray200, marginTop: 4, flexShrink: 0 },
  dotActive: { backgroundColor: colors.primary },
  notifBody: { flex: 1 },
  notifTitle: { fontSize: fontSize.sm, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  notifText: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  notifTime: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4 },
  empty: { alignItems: 'center', paddingVertical: 64 },
  emptyTitle: { fontSize: fontSize.lg, fontFamily: 'Inter_600SemiBold', color: colors.textMuted, marginTop: 12 },
})
