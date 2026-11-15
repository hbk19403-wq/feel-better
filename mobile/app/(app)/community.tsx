import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';
import {
  useGetCommunityGroupsQuery, useGetGroupPostsQuery, useCreatePostMutation,
  useSupportPostMutation, useGetGroupChatQuery, useSendGroupChatMutation,
} from '../../src/store/api/apiSlice';

const GRADS: [string, string][] = [
  ['#6366F1', '#4F46E5'], ['#EC4899', '#DB2777'], ['#17A589', '#0e7a5f'], ['#F59E0B', '#D97706'],
  ['#8B5CF6', '#7C3AED'], ['#2E75B6', '#1A3C5E'], ['#EF4444', '#B91C1C'], ['#10B981', '#047857'],
];
const gradFor = (i: number) => GRADS[i % GRADS.length];

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function CommunityScreen() {
  const { data: groups, isLoading } = useGetCommunityGroupsQuery();
  const [active, setActive] = useState<any | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  if (isLoading) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}><ActivityIndicator color={Colors.primaryMid} style={{ marginTop: 80 }} /></SafeAreaView>;
  }

  if (active) {
    return <GroupDetail group={active} idx={activeIdx} onBack={() => setActive(null)} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <LinearGradient colors={['#7C3AED', '#DB2777']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 24, marginBottom: 20 }}>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>COMMUNITY</Text>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 8 }}>You're not the only one feeling this.</Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 6, lineHeight: 20 }}>Open, anonymous conversations — post, reply, or join a live room.</Text>
        </LinearGradient>

        <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 18 }}>
          <Text style={{ fontSize: 12.5, color: Colors.textSecondary, lineHeight: 18 }}>
            💬 Anonymous by default. Peer support, not professional care. In crisis? Call Tele-MANAS 14416 or 112.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          {groups?.map((g: any, i: number) => {
            const [c1, c2] = gradFor(i);
            return (
              <TouchableOpacity key={g.id} activeOpacity={0.85} onPress={() => { setActive(g); setActiveIdx(i); }}
                style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }}>
                <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 30 }}>{g.emoji || '💬'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>{g.name}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12.5 }}>{g.post_count} {g.post_count === 1 ? 'post' : 'posts'} · tap to open →</Text>
                  </View>
                </LinearGradient>
                {g.description ? <Text style={{ padding: 14, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 }}>{g.description}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function GroupDetail({ group, idx, onBack }: { group: any; idx: number; onBack: () => void }) {
  const [tab, setTab] = useState<'posts' | 'chat'>('posts');
  const [c1, c2] = gradFor(idx);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <TouchableOpacity onPress={onBack} style={{ paddingVertical: 8 }}>
          <Text style={{ color: Colors.primaryMid, fontWeight: '600', fontSize: 15 }}>← All groups</Text>
        </TouchableOpacity>
        <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 16, padding: 18, marginBottom: 14 }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>{group.emoji} {group.name}</Text>
          {group.description ? <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4 }}>{group.description}</Text> : null}
        </LinearGradient>

        <View style={{ flexDirection: 'row', gap: 8, backgroundColor: Colors.surface, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 }}>
          {(['posts', 'chat'] as const).map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={{ flex: 1, paddingVertical: 9, borderRadius: 9, backgroundColor: tab === t ? c1 : 'transparent', alignItems: 'center' }}>
              <Text style={{ color: tab === t ? '#fff' : Colors.textSecondary, fontWeight: '700', fontSize: 14 }}>{t === 'posts' ? '📝 Discussions' : '💬 Live Chat'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {tab === 'posts' ? <PostsTab slug={group.slug} accent={c1} /> : <ChatTab slug={group.slug} accent={c1} />}
    </SafeAreaView>
  );
}

function PostsTab({ slug, accent }: { slug: string; accent: string }) {
  const { data, isLoading } = useGetGroupPostsQuery(slug);
  const [createPost, { isLoading: posting }] = useCreatePostMutation();
  const [supportPost] = useSupportPostMutation();
  const [body, setBody] = useState('');
  const [alias, setAlias] = useState('');

  async function submit() {
    if (!body.trim()) return;
    try { await createPost({ slug, body, alias: alias || undefined }).unwrap(); setBody(''); } catch {}
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 40 }}>
      <View style={{ backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 }}>
        <TextInput value={body} onChangeText={setBody} placeholder="Share what's on your mind…" placeholderTextColor={Colors.textSecondary}
          multiline style={{ minHeight: 70, fontSize: 14, color: Colors.textPrimary, textAlignVertical: 'top' }} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' }}>
          <TextInput value={alias} onChangeText={setAlias} placeholder="🙈 Anonymous" placeholderTextColor={Colors.textSecondary}
            style={{ flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 }} />
          <TouchableOpacity onPress={submit} disabled={posting || !body.trim()} style={{ backgroundColor: accent, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10, opacity: posting || !body.trim() ? 0.5 : 1 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{posting ? '…' : 'Post'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? <ActivityIndicator color={Colors.primaryMid} style={{ marginTop: 24 }} /> : (data?.posts?.length ? (
        <View style={{ gap: 12 }}>
          {data.posts.map((p: any) => (
            <View key={p.id} style={{ backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border }}>
              <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 6 }}>{p.author_alias} · {timeAgo(p.created_at)}</Text>
              {p.title ? <Text style={{ fontSize: 15, fontWeight: '700', marginBottom: 4 }}>{p.title}</Text> : null}
              <Text style={{ fontSize: 14, lineHeight: 20, color: Colors.textPrimary }}>{p.body}</Text>
              <TouchableOpacity onPress={() => supportPost(p.id)} style={{ marginTop: 12, alignSelf: 'flex-start', backgroundColor: Colors.background, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ fontSize: 13, color: Colors.textSecondary }}>🫶 I feel this · {p.support_count}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <View style={{ alignItems: 'center', paddingTop: 40 }}>
          <Text style={{ fontSize: 40 }}>🌱</Text>
          <Text style={{ color: Colors.textSecondary, marginTop: 10 }}>Be the first to open up here.</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function ChatTab({ slug, accent }: { slug: string; accent: string }) {
  // Poll the live room every 3s.
  const { data, isLoading } = useGetGroupChatQuery(slug, { pollingInterval: 3000 });
  const [sendChat, { isLoading: sending }] = useSendGroupChatMutation();
  const [draft, setDraft] = useState('');
  const [alias, setAlias] = useState('');
  const messages: any[] = data?.messages || [];
  const setupPending = data?.setup_pending;

  async function send() {
    if (!draft.trim()) return;
    const body = draft; setDraft('');
    try { await sendChat({ slug, body, alias: alias || undefined }).unwrap(); } catch {}
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 0, gap: 12 }}>
        <View style={{ backgroundColor: '#E8F8F5', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#A7F3D0' }}>
          <Text style={{ fontSize: 12.5, color: '#065F46', lineHeight: 18 }}>💬 Live room — anyone here now can reply. Stay anonymous, be kind.</Text>
        </View>
        {isLoading ? <ActivityIndicator color={Colors.primaryMid} style={{ marginTop: 20 }} /> : setupPending ? (
          <View style={{ alignItems: 'center', paddingTop: 30 }}><Text style={{ fontSize: 36 }}>🛠️</Text><Text style={{ color: Colors.textSecondary, marginTop: 8 }}>Chat rooms are being set up.</Text></View>
        ) : messages.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 30 }}><Text style={{ fontSize: 36 }}>👋</Text><Text style={{ color: Colors.textSecondary, marginTop: 8 }}>No one's talking yet. Say hi.</Text></View>
        ) : messages.map((m) => (
          <View key={m.id} style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{(m.author_alias || 'A').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11.5, color: Colors.textSecondary }}>{m.author_alias} · {timeAgo(m.created_at)}</Text>
              <View style={{ alignSelf: 'flex-start', backgroundColor: m.is_crisis ? '#FEF2F2' : Colors.surface, borderWidth: 1, borderColor: m.is_crisis ? '#FECACA' : Colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginTop: 2 }}>
                <Text style={{ fontSize: 14, color: Colors.textPrimary, lineHeight: 19 }}>{m.body}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center' }}>
        <TextInput value={alias} onChangeText={setAlias} placeholder="🙈" placeholderTextColor={Colors.textSecondary}
          style={{ width: 54, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 }} />
        <TextInput value={draft} onChangeText={setDraft} placeholder="Message the room…" placeholderTextColor={Colors.textSecondary}
          style={{ flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14 }} />
        <TouchableOpacity onPress={send} disabled={sending || !draft.trim()} style={{ backgroundColor: accent, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, opacity: sending || !draft.trim() ? 0.5 : 1 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{sending ? '…' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
