import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';
import { useGetVentFeedQuery, useSubmitVentMutation } from '../../src/store/api/apiSlice';

const MOODS = [
  { id: 'sad', emoji: '😔' }, { id: 'anxious', emoji: '😰' }, { id: 'angry', emoji: '😤' },
  { id: 'numb', emoji: '😶' }, { id: 'tired', emoji: '😮‍💨' }, { id: 'hopeful', emoji: '🌤️' },
];

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function VentLineScreen() {
  const { data: feed, isLoading } = useGetVentFeedQuery();
  const [submitVent, { isLoading: sending }] = useSubmitVentMutation();
  const [body, setBody] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [reply, setReply] = useState<string | null>(null);

  async function send() {
    if (!body.trim()) return;
    setReply(null);
    try {
      const res: any = await submitVent({ body, mood: mood || undefined, is_public: isPublic }).unwrap();
      setReply(res?.ai_reply || res?.entry?.ai_reply || null);
      setBody(''); setMood(null);
    } catch {}
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <LinearGradient colors={['#1A3C5E', '#17A589']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 24, marginBottom: 20 }}>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>THE VENT LINE</Text>
          <Text style={{ color: '#fff', fontSize: 23, fontWeight: '800', marginTop: 8 }}>Don't want advice? Just vent.</Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 6, lineHeight: 20 }}>Let it out. No fixing, no judgment — just a place to be heard.</Text>
        </LinearGradient>

        {/* Composer */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 20 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
            {MOODS.map((m) => (
              <TouchableOpacity key={m.id} onPress={() => setMood(mood === m.id ? null : m.id)}
                style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: mood === m.id ? Colors.accentTeal : Colors.border, backgroundColor: mood === m.id ? '#E8F8F5' : Colors.surface }}>
                <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TextInput value={body} onChangeText={setBody} placeholder="Everything you're holding in… let it out here." placeholderTextColor={Colors.textSecondary}
            multiline style={{ minHeight: 100, fontSize: 15, color: Colors.textPrimary, textAlignVertical: 'top' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
            <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: Colors.accentTeal }} />
            <Text style={{ fontSize: 13, color: Colors.textSecondary, marginLeft: 8, flex: 1 }}>Share anonymously on the public wall</Text>
            <TouchableOpacity onPress={send} disabled={sending || !body.trim()}
              style={{ backgroundColor: Colors.accentTeal, borderRadius: 22, paddingHorizontal: 22, paddingVertical: 11, opacity: sending || !body.trim() ? 0.5 : 1 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{sending ? '…' : 'Vent'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {reply ? (
          <View style={{ backgroundColor: '#E8F8F5', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#A7F3D0', marginBottom: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0e7a5f', marginBottom: 6 }}>💚 We heard you</Text>
            <Text style={{ fontSize: 14.5, color: Colors.textPrimary, lineHeight: 21 }}>{reply}</Text>
          </View>
        ) : null}

        {/* Public wall */}
        <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 12 }}>💬 The Wall</Text>
        {isLoading ? <ActivityIndicator color={Colors.primaryMid} style={{ marginTop: 20 }} /> : (feed?.length ? (
          <View style={{ gap: 12 }}>
            {feed.map((v: any) => (
              <View key={v.id} style={{ backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 4, borderLeftColor: Colors.accentTeal }}>
                <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 6 }}>{v.alias || 'Anonymous'} · {timeAgo(v.created_at)}</Text>
                <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textPrimary }}>{v.body}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ alignItems: 'center', paddingTop: 30 }}>
            <Text style={{ fontSize: 36 }}>🕊️</Text>
            <Text style={{ color: Colors.textSecondary, marginTop: 8 }}>The wall is quiet. Your voice could be the first.</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
