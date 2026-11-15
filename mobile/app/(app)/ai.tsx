import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { useGetAiListenersQuery } from '../../src/store/api/apiSlice';

export default function AiListenersScreen() {
  const { data: listeners, isLoading } = useGetAiListenersQuery();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical: 6 }}>
          <Text style={{ color: Colors.primaryMid, fontWeight: '600', fontSize: 15 }}>← Back</Text>
        </TouchableOpacity>

        <LinearGradient colors={['#6B21A8', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 24, marginBottom: 20 }}>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>AI LISTENERS</Text>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 8 }}>Someone to talk to, 24/7.</Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 6, lineHeight: 20 }}>Caring AI companions, here whenever you need them. First 15 min free.</Text>
        </LinearGradient>

        {isLoading ? <ActivityIndicator color={Colors.primaryMid} style={{ marginTop: 40 }} /> : (
          <View style={{ gap: 12 }}>
            {(listeners || []).map((l: any) => {
              const grad: [string, string] = l.gender === 'female' ? ['#F472B6', '#C084FC'] : ['#60A5FA', '#818CF8'];
              return (
                <View key={l.id} style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }}>
                  <View style={{ height: 6, backgroundColor: grad[0] }} />
                  <View style={{ padding: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 26 }}>{l.avatar_emoji || '💬'}</Text>
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 17, fontWeight: '800', color: Colors.textPrimary }}>{l.name}</Text>
                        <Text style={{ fontSize: 12.5, color: Colors.textSecondary }}>{l.gender === 'female' ? '♀ Female' : '♂ Male'} · {(l.languages || ['English']).join(', ')}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                      <TouchableOpacity onPress={() => router.push(`/(app)/ai-chat/${l.id}`)}
                        style={{ flex: 1, borderWidth: 1.5, borderColor: Colors.primaryMid, borderRadius: 22, paddingVertical: 11, alignItems: 'center' }}>
                        <Text style={{ color: Colors.primaryMid, fontWeight: '700' }}>💬 Chat</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => router.push(`/(app)/ai-voice/${l.id}`)}
                        style={{ flex: 1, backgroundColor: Colors.primaryMid, borderRadius: 22, paddingVertical: 11, alignItems: 'center' }}>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>🎙️ Voice</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
