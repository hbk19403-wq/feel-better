import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, MOOD_LABELS } from '../../src/constants/colors';
import { useAppSelector } from '../../src/store';
import { useGetWellnessTrendsQuery, useGetWorkshopsQuery, useGetResourcesQuery, useSubmitCheckinMutation } from '../../src/store/api/apiSlice';
import { useState } from 'react';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const [todayMood, setTodayMood] = useState<number | null>(null);
  const [submitCheckin] = useSubmitCheckinMutation();
  const { data: trends } = useGetWellnessTrendsQuery();
  const { data: workshops, isLoading: workshopsLoading } = useGetWorkshopsQuery();
  const { data: resources } = useGetResourcesQuery({});

  const handleMoodSelect = async (mood: number) => {
    setTodayMood(mood);
    await submitCheckin({ mood });
  };

  const firstName = user?.name?.split(' ')[0] ?? 'Friend';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '700', color: Colors.textPrimary }}>
              {getGreeting()}, {firstName}
            </Text>
            <Text style={{ fontSize: 15, color: Colors.textSecondary, marginTop: 2 }}>How are you feeling today?</Text>
          </View>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20 }}>🫂</Text>
          </View>
        </View>

        {/* Mood Ring / Daily Check-in */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 }}>Daily Check-In</Text>
          <Text style={{ fontSize: 14, color: Colors.textSecondary, marginBottom: 16 }}>
            {todayMood ? `You're feeling ${MOOD_LABELS[todayMood]} today` : "How's your mood right now?"}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {[1, 2, 3, 4, 5].map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => handleMoodSelect(m)}
                style={{
                  width: 52, height: 52, borderRadius: 26,
                  backgroundColor: todayMood === m ? Colors.primaryLight : Colors.background,
                  borderWidth: 2, borderColor: todayMood === m ? Colors.primaryMid : Colors.border,
                  alignItems: 'center', justifyContent: 'center',
                }}
                accessibilityLabel={`Mood ${m}`}
              >
                <Text style={{ fontSize: 24 }}>{MOOD_LABELS[m]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Connect FAB-style card */}
        <TouchableOpacity
          onPress={() => router.push('/(app)/match')}
          style={{
            backgroundColor: Colors.primaryMid, borderRadius: 16, padding: 20,
            flexDirection: 'row', alignItems: 'center', gap: 14,
          }}
          accessibilityLabel="Start a session"
        >
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 26 }}>🎙️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700' }}>Talk to a Listener</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 }}>
              Matched in under 5 seconds
            </Text>
          </View>
          <Text style={{ color: '#FFF', fontSize: 22 }}>→</Text>
        </TouchableOpacity>

        {/* Mood Trend */}
        {trends && trends.length > 0 && (
          <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 }}>Mood This Month</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 60 }}>
              {trends.slice(-14).map((t: any, i: number) => (
                <View
                  key={i}
                  style={{
                    flex: 1, backgroundColor: Colors.primaryLight, borderRadius: 4,
                    height: `${(parseFloat(t.avg_mood) / 5) * 100}%`,
                    minHeight: 8,
                  }}
                />
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: Colors.textSecondary }}>14 days ago</Text>
              <Text style={{ fontSize: 12, color: Colors.textSecondary }}>Today</Text>
            </View>
          </View>
        )}

        {/* Upcoming Workshops */}
        {workshops && workshops.length > 0 && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 }}>Upcoming Workshops</Text>
            {workshops.slice(0, 2).map((w: any) => (
              <View
                key={w.id}
                style={{ backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: Colors.accentTeal }}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>{w.title}</Text>
                <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 4 }}>
                  {new Date(w.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Resources */}
        {resources && resources.length > 0 && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 }}>For You</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
              {resources.slice(0, 5).map((r: any) => (
                <View
                  key={r.id}
                  style={{ width: 160, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border }}
                >
                  <Text style={{ fontSize: 28, marginBottom: 8 }}>
                    {r.type === 'audio' ? '🎧' : r.type === 'workbook' ? '📓' : r.type === 'ebook' ? '📖' : '📄'}
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textPrimary, lineHeight: 18 }} numberOfLines={3}>{r.title}</Text>
                  <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 6 }}>{r.duration_minutes} min</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
