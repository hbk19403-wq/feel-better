import { View, Text, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, AGE_SEGMENTS, SUPPORT_CATEGORIES } from '../../src/constants/colors';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { logout } from '../../src/store/authSlice';
import { useGetSubscriptionQuery, useUpdateMeMutation } from '../../src/store/api/apiSlice';

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: Colors.textSecondary },
  basic: { label: 'Basic', color: Colors.primaryMid },
  standard: { label: 'Standard', color: Colors.accentTeal },
  premium: { label: 'Premium', color: Colors.warningAmber },
  corporate: { label: 'Corporate', color: Colors.primaryDark },
};

export default function ProfileScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const { data: sub } = useGetSubscriptionQuery();
  const [updateMe] = useUpdateMeMutation();

  const planInfo = PLAN_LABELS[user?.subscription_plan ?? 'free'];

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { dispatch(logout()); router.replace('/(auth)'); } },
    ]);
  };

  const toggleAnonymous = async (val: boolean) => {
    await updateMe({ anonymous_mode: val });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Avatar + name */}
        <View style={{ alignItems: 'center', marginBottom: 28, paddingTop: 8 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primaryLight,
            alignItems: 'center', justifyContent: 'center', marginBottom: 12,
          }}>
            <Text style={{ fontSize: 36 }}>🫂</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '700', color: Colors.textPrimary }}>{user?.name}</Text>
          <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 2 }}>{user?.email}</Text>
          <View style={{
            marginTop: 10, backgroundColor: planInfo.color + '20',
            borderRadius: 16, paddingHorizontal: 14, paddingVertical: 5,
          }}>
            <Text style={{ color: planInfo.color, fontWeight: '700', fontSize: 13 }}>{planInfo.label} Plan</Text>
          </View>
        </View>

        {/* Subscription card */}
        {sub && (
          <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 }}>Your Plan</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {sub.sessions_limit ? (
                <>
                  <Text style={{ color: Colors.textSecondary }}>Sessions used</Text>
                  <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>{sub.sessions_used} / {sub.sessions_limit}</Text>
                </>
              ) : (
                <>
                  <Text style={{ color: Colors.textSecondary }}>Sessions</Text>
                  <Text style={{ fontWeight: '700', color: Colors.accentTeal }}>Unlimited</Text>
                </>
              )}
            </View>
            <TouchableOpacity
              style={{ marginTop: 14, backgroundColor: Colors.primaryMid, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFF', fontWeight: '700' }}>Upgrade Plan</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Settings */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14 }}>Privacy Settings</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: Colors.textPrimary, fontWeight: '600' }}>Anonymous Mode</Text>
              <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 }}>Hide your name from listeners</Text>
            </View>
            <Switch
              value={user?.anonymous_mode ?? false}
              onValueChange={toggleAnonymous}
              trackColor={{ true: Colors.primaryMid }}
            />
          </View>
        </View>

        {/* Info rows */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 16, overflow: 'hidden' }}>
          {[
            { label: 'Age Group', value: AGE_SEGMENTS.find(a => a.id === user?.age_segment)?.description ?? 'Not set' },
            { label: 'Profession', value: user?.profession ?? 'Not set' },
            { label: 'Language', value: user?.language_preference?.toUpperCase() ?? 'EN' },
          ].map((row, i) => (
            <View
              key={row.label}
              style={{
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                padding: 16, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: Colors.border,
              }}
            >
              <Text style={{ fontSize: 15, color: Colors.textSecondary }}>{row.label}</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.textPrimary }}>{row.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          style={{ borderWidth: 1.5, borderColor: Colors.dangerRed, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
        >
          <Text style={{ color: Colors.dangerRed, fontSize: 16, fontWeight: '700' }}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
