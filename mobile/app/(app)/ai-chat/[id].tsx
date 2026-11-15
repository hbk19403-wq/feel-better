import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import UpiPayModal from '../../../src/components/UpiPayModal';
import { useCreateAiSessionMutation, useSendAiMessageMutation, useRequestSessionMutation, useUnlockChatAdviceMutation, useConfirmChatUnlockMutation } from '../../../src/store/api/apiSlice';

interface Msg { role: 'user' | 'assistant'; content: string; crisis?: boolean }

export default function AiChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [createSession] = useCreateAiSessionMutation();
  const [sendMessage, { isLoading: sending }] = useSendAiMessageMutation();
  const [requestSession, { isLoading: connectingHuman }] = useRequestSessionMutation();
  const [unlockAdvice] = useUnlockChatAdviceMutation();
  const [confirmUnlock] = useConfirmChatUnlockMutation();
  const [paywall, setPaywall] = useState<any | null>(null);
  const [order, setOrder] = useState<any | null>(null);
  const [utr, setUtr] = useState('');
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [startError, setStartError] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView | null>(null);

  // Create the AI session once when the screen opens.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s: any = await createSession({ ai_listener_id: String(id), mode: 'vent' }).unwrap();
        if (!cancelled) {
          setSessionId(s.id);
          setMessages([{ role: 'assistant', content: "Hi, I'm really glad you're here. Whatever's on your mind, take your time — I'm listening. 💚" }]);
        }
      } catch {
        if (!cancelled) setStartError("Couldn't start the chat. Please check your connection and try again.");
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => { scrollRef.current?.scrollToEnd({ animated: true }); }, [messages, sending]);

  // Escalate to a live human listener. Creates a session and opens the live
  // chat; billing is ₹1/min once a listener joins.
  async function connectToHuman() {
    if (connectingHuman) return;
    try {
      const s: any = await requestSession({ category: 'venting_general', session_type: 'text' }).unwrap();
      const sid = s?.session?.id || s?.id;
      if (sid) router.push(`/(app)/session/${sid}`);
    } catch {}
  }

  async function send() {
    const content = draft.trim();
    if (!content || !sessionId || sending) return;
    setDraft('');
    setMessages((m) => [...m, { role: 'user', content }]);
    try {
      const res: any = await sendMessage({ id: sessionId, content }).unwrap();
      setMessages((m) => [...m, { role: 'assistant', content: res.message, crisis: res.crisis }]);
      if (res.paywall) setPaywall(res.pass || { minutes: 15, amount_inr: 15 });
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: "I'm having trouble responding right now — but I don't want you to feel alone. If it's urgent, call Tele-MANAS 14416 or 112." }]);
    }
  }

  async function startUnlock() {
    if (!sessionId) return;
    setUnlockBusy(true);
    try {
      const d: any = await unlockAdvice(sessionId).unwrap();
      if (d.already_unlocked) { setPaywall(null); return; }
      setOrder(d); setUtr('');
    } catch {} finally { setUnlockBusy(false); }
  }

  async function doConfirmUnlock() {
    if (!sessionId || !order) return;
    setUnlockBusy(true);
    try {
      const d: any = await confirmUnlock({ id: sessionId, txn_ref: order.txn_ref, upi_txn_id: utr.trim() }).unwrap();
      if (d.advice_unlocked) {
        setOrder(null); setPaywall(null);
        setMessages((m) => [...m, { role: 'assistant', content: "Thank you — I'm really glad we can keep going. Okay, let's get into what will actually help you." }]);
      }
    } catch {} finally { setUnlockBusy(false); }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface }}>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: Colors.primaryMid, fontWeight: '600', fontSize: 16 }}>←</Text></TouchableOpacity>
        <Text style={{ fontWeight: '800', fontSize: 16, color: Colors.textPrimary, flex: 1 }}>AI Listener</Text>
        <TouchableOpacity onPress={connectToHuman} disabled={connectingHuman}
          style={{ backgroundColor: Colors.primaryMid, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7, opacity: connectingHuman ? 0.6 : 1 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>🤝 Human · ₹1/min</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        {starting ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={Colors.primaryMid} /></View>
        ) : startError ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <Text style={{ fontSize: 40 }}>😕</Text>
            <Text style={{ color: Colors.textSecondary, textAlign: 'center', marginTop: 12 }}>{startError}</Text>
            <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16, backgroundColor: Colors.primaryMid, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Go back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, gap: 10 }}>
              {messages.map((m, i) => (
                <View key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
                  <View style={{
                    backgroundColor: m.role === 'user' ? Colors.primaryMid : (m.crisis ? '#FEF2F2' : Colors.surface),
                    borderWidth: m.role === 'user' ? 0 : 1, borderColor: m.crisis ? '#FECACA' : Colors.border,
                    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
                  }}>
                    <Text style={{ color: m.role === 'user' ? '#fff' : Colors.textPrimary, fontSize: 15, lineHeight: 21 }}>{m.content}</Text>
                  </View>
                </View>
              ))}
              {sending && <View style={{ alignSelf: 'flex-start' }}><ActivityIndicator color={Colors.primaryMid} style={{ marginLeft: 8 }} /></View>}
            </ScrollView>

            {paywall && !order ? (
              <View style={{ margin: 12, borderRadius: 16, padding: 16, backgroundColor: '#EEF6FF', borderWidth: 1, borderColor: '#BFDBFE' }}>
                <Text style={{ fontWeight: '800', fontSize: 15, textAlign: 'center' }}>🔓 Continue with real guidance</Text>
                <Text style={{ fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 12 }}>
                  First 5 minutes are free. To keep going with specific advice it's ₹1/min — {paywall.minutes} min for ₹{paywall.amount_inr}.
                </Text>
                <TouchableOpacity onPress={startUnlock} disabled={unlockBusy} style={{ backgroundColor: Colors.primaryMid, borderRadius: 22, paddingVertical: 12, alignItems: 'center', opacity: unlockBusy ? 0.6 : 1 }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{unlockBusy ? 'Loading…' : `Continue · ₹${paywall.amount_inr} via UPI`}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center' }}>
              <TextInput value={draft} onChangeText={setDraft} placeholder="Type a message…" placeholderTextColor={Colors.textSecondary}
                multiline style={{ flex: 1, maxHeight: 100, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, fontSize: 15 }} />
              <TouchableOpacity onPress={send} disabled={sending || !draft.trim()}
                style={{ backgroundColor: Colors.primaryMid, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 11, opacity: sending || !draft.trim() ? 0.5 : 1 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Send</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      <UpiPayModal order={order} subtitle={order ? `${order.minutes} min of full guidance · ₹1/min` : undefined}
        utr={utr} onChangeUtr={setUtr} onConfirm={doConfirmUnlock} onCancel={() => setOrder(null)} busy={unlockBusy} />
    </SafeAreaView>
  );
}
