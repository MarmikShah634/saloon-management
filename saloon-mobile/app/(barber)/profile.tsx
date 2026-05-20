import React from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from "@/lib/stores/auth.store"
import { useRouter } from "expo-router"
import { authApi } from '@/lib/api/endpoints'
import { clearTokens } from '@/lib/api/client'
import { colors, fontSize, spacing, borderRadius, shadows } from '@/theme'

function MenuItem({ icon, label, onPress, danger }: { icon: string; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon as never} size={18} color={danger ? colors.red500 : colors.primary} />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  )
}

export default function BarberProfileScreen() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure?', [
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() ?? 'B'}</Text>
          </View>
          <Text style={styles.name}>{user?.name ?? 'Barber'}</Text>
          <Text style={styles.email}>{user?.email ?? ''}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="cut-outline" size={12} color={colors.primary} />
            <Text style={styles.roleText}>Barber</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="person-outline" label="Edit Profile" onPress={() => Alert.alert('Edit Profile', 'Update your profile from the web portal.')} />
            <View style={styles.divider} />
            <MenuItem icon="time-outline" label="Working Hours" onPress={() => Alert.alert('Working Hours', 'Manage your schedule in the Schedule tab.')} />
            <View style={styles.divider} />
            <MenuItem icon="notifications-outline" label="Notifications" onPress={() => {}} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="log-out-outline" label="Sign Out" onPress={handleLogout} danger />
          </View>
        </View>

        <Text style={styles.version}>Saloon Barber App v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.gray50 },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 80 },
  avatarSection: { alignItems: 'center', paddingVertical: spacing.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, ...shadows.xl },
  avatarText: { fontSize: 32, fontFamily: 'Inter_700Bold', color: colors.white },
  name: { fontSize: fontSize.xl, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  email: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ede9fe', borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 4, marginTop: 10 },
  roleText: { fontSize: fontSize.xs, fontFamily: 'Inter_600SemiBold', color: colors.primary },
  section: { marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.xs, fontFamily: 'Inter_700Bold', color: colors.textMuted, letterSpacing: 0.8, marginBottom: 8, paddingHorizontal: 4 },
  menuCard: { backgroundColor: colors.white, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.border, ...shadows.sm, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: borderRadius.lg, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center' },
  menuIconDanger: { backgroundColor: '#fee2e2' },
  menuLabel: { flex: 1, fontSize: fontSize.base, fontFamily: 'Inter_500Medium', color: colors.textPrimary },
  menuLabelDanger: { color: colors.red500 },
  divider: { height: 1, backgroundColor: colors.gray100, marginLeft: 64 },
  version: { textAlign: 'center', fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xl },
})
