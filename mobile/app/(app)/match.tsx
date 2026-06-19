import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, SUPPORT_CATEGORIES } from '../../src/constants/colors';
import { useGetAvailableListenersQuery, useRequestSessionMutation } from '../../src/store/api/apiSlice';

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text key={s} style={{ fontSize: 12, color: s <= Math.round(rating) ? Colors.warningAmber : Colors.border }}>★</Text>
      ))}
      <Text style={{ fontSize: 12, color: Colors.textSecondary, marginLeft: 4 }}>{rating.toFixed(1)}</Text>
    </View>
  );
}

export default function MatchScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [step, setStep] = useState<'category' | 'listeners'>('category');
  const [requestSession, { isLoading: requesting }] = useRequestSessionMutation();

  const { data: listeners, isLoading, refetch } = useGetAvailableListenersQuery(
    { category_id: selectedCategory ?? undefined },
    { skip: !selectedCategory || step !== 'listeners' }
  );

  const handleSelectCategory = (id: string) => {
    setSelectedCategory(id);
    setStep('listeners');
  };

  const handleConnect = async (listenerId: string) => {
    if (!selectedCategory) return;
    try {
      const session = await requestSession({
        category_id: selectedCategory,
        session_type: 'voice',
        listener_id: listenerId,
      }).unwrap();
      router.push({ pathname: '/(app)/session/[id]', params: { id: session.id } });
    } catch {
      Alert.alert('Error', 'Could not start session. Please try again.');
    }
  };

  const handleBestMatch = async () => {
    if (!selectedCategory || !listeners?.length) return;
    await handleConnect(listeners[0].id);
  };

  if (step === 'category') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <Text style={{ fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 }}>
            What's on your mind?
          </Text>
          <Text style={{ fontSize: 16, color: Colors.textSecondary, marginBottom: 24, lineHeight: 22 }}>
            Choose a topic to find the right listener for you.
          </Text>
          <View style={{ gap: 10 }}>
            {SUPPORT_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => handleSelectCategory(cat.id)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                  backgroundColor: Colors.surface, borderRadius: 14,
                  padding: 16, borderWidth: 1, borderColor: Colors.border,
                }}
              >
                <Text style={{ fontSize: 24 }}>{cat.emoji}</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.textPrimary, flex: 1 }}>{cat.label}</Text>
                <Text style={{ color: Colors.textSecondary, fontSize: 18 }}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <TouchableOpacity onPress={() => setStep('category')} style={{ marginBottom: 20 }}>
          <Text style={{ color: Colors.primaryMid, fontSize: 16 }}>← Change topic</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 }}>Available Listeners</Text>
        <Text style={{ fontSize: 15, color: Colors.textSecondary, marginBottom: 20 }}>
          Matched to: {SUPPORT_CATEGORIES.find(c => c.id === selectedCategory)?.label}
        </Text>

        {isLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <ActivityIndicator size="large" color={Colors.primaryMid} />
            <Text style={{ color: Colors.textSecondary, marginTop: 16, fontSize: 15 }}>Finding your perfect match…</Text>
          </View>
        ) : listeners?.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 36 }}>😔</Text>
            <Text style={{ fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginTop: 12 }}>No listeners available</Text>
            <Text style={{ color: Colors.textSecondary, textAlign: 'center', marginTop: 8 }}>
              All our listeners are currently busy. Please try again shortly.
            </Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              onPress={handleBestMatch}
              disabled={requesting}
              style={{ backgroundColor: Colors.accentTeal, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 20 }}
            >
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>⚡ Connect with Best Match</Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.textSecondary, marginBottom: 12 }}>Or choose a listener:</Text>

            {listeners?.map((l: any, idx: number) => (
              <View
                key={l.id}
                style={{
                  backgroundColor: Colors.surface, borderRadius: 16, padding: 18,
                  marginBottom: 12, borderWidth: 1, borderColor: Colors.border,
                  shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <View style={{
                    width: 48, height: 48, borderRadius: 24,
                    backgroundColor: [Colors.primaryLight, Colors.accentTeal + '30', Colors.warningAmber + '30'][idx % 3],
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 22 }}>🎧</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 17, fontWeight: '700', color: Colors.textPrimary }}>{l.alias}</Text>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: l.status === 'online' ? Colors.accentTeal : Colors.textSecondary }} />
                    </View>
                    <StarRating rating={parseFloat(l.average_rating)} />
                  </View>
                  {l.estimated_wait_minutes === 0 ? (
                    <View style={{ backgroundColor: Colors.accentTeal + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 12, color: Colors.accentTeal, fontWeight: '700' }}>Ready now</Text>
                    </View>
                  ) : (
                    <View style={{ backgroundColor: Colors.warningAmber + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 12, color: Colors.warningAmber, fontWeight: '700' }}>~{l.estimated_wait_minutes}m</Text>
                    </View>
                  )}
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {l.specializations?.slice(0, 3).map((s: string) => (
                    <View key={s} style={{ backgroundColor: Colors.primaryLight, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 11, color: Colors.primaryDark, fontWeight: '600' }}>
                        {SUPPORT_CATEGORIES.find(c => c.id === s)?.label ?? s}
                      </Text>
                    </View>
                  ))}
                  {l.is_trauma_informed && (
                    <View style={{ backgroundColor: Colors.accentTeal + '20', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 11, color: Colors.accentTeal, fontWeight: '600' }}>Trauma-informed</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => handleConnect(l.id)}
                  disabled={requesting}
                  style={{ backgroundColor: Colors.primaryMid, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>Connect Now</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
