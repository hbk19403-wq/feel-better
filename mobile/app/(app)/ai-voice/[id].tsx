import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
// react-native-webrtc is a native module — only runs in a dev/EAS build, not Expo Go.
import { RTCPeerConnection, RTCSessionDescription, mediaDevices } from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';
import { Colors } from '../../../src/constants/colors';
import { useGetVoiceTokenMutation, useEndVoiceSessionMutation } from '../../../src/store/api/apiSlice';

type Phase = 'select' | 'connecting' | 'live' | 'ended' | 'error';
const REALTIME_URL = 'https://api.openai.com/v1/realtime?model=gpt-realtime-mini';

const VOICES = [
  { id: 'marin', label: 'Marin', hint: 'warm & natural' },
  { id: 'cedar', label: 'Cedar', hint: 'calm & grounded' },
  { id: 'shimmer', label: 'Shimmer', hint: 'soft & soothing' },
  { id: 'coral', label: 'Coral', hint: 'gentle & bright' },
];

export default function AiVoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [getToken] = useGetVoiceTokenMutation();
  const [endSession] = useEndVoiceSessionMutation();

  const [phase, setPhase] = useState<Phase>('select');
  const [voice, setVoice] = useState('marin');
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [listenerName, setListenerName] = useState('AI Listener');
  const [listenerEmoji, setListenerEmoji] = useState('💬');

  const pcRef = useRef<any>(null);
  const localStreamRef = useRef<any>(null);
  const aiSessionIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase !== 'connecting') return;
    let cancelled = false;

    async function connect() {
      try {
        // 1) Get an ephemeral OpenAI Realtime token from our backend.
        const res: any = await getToken({ ai_listener_id: String(id), mode: 'advisory', voice }).unwrap();
        if (cancelled) return;
        aiSessionIdRef.current = res.ai_session_id || null;
        if (res.listener?.name) setListenerName(res.listener.name);
        if (res.listener?.avatar_emoji) setListenerEmoji(res.listener.avatar_emoji);
        const ephemeral = res.token;
        if (!ephemeral) throw new Error('no token');

        // 2) Mic + peer connection. Start the audio session and route to the
        // loudspeaker so the AI's voice is comfortably audible hands-free.
        InCallManager.start({ media: 'audio' });
        InCallManager.setForceSpeakerphoneOn(true);
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        pcRef.current = pc;
        const stream = await mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        stream.getTracks().forEach((t: any) => pc.addTrack(t, stream));

        // Data channel for realtime events (kept open; audio flows over media tracks).
        pc.createDataChannel('oai-events');

        pc.addEventListener('connectionstatechange', () => {
          const s = pc.connectionState;
          if (s === 'connected' && !cancelled) setPhase('live');
          if ((s === 'failed' || s === 'disconnected') && !cancelled) { setError('Call disconnected.'); setPhase('error'); }
        });

        // 3) Offer → OpenAI → answer.
        const offer = await pc.createOffer({});
        await pc.setLocalDescription(offer);
        const sdpRes = await fetch(REALTIME_URL, {
          method: 'POST',
          headers: { Authorization: `Bearer ${ephemeral}`, 'Content-Type': 'application/sdp' },
          body: offer.sdp,
        });
        if (!sdpRes.ok) throw new Error('realtime handshake failed');
        const answer = { type: 'answer' as const, sdp: await sdpRes.text() };
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        // Inbound audio auto-plays via the native audio session.
      } catch (e: any) {
        if (!cancelled) { setError('Could not start the voice call. Please try again.'); setPhase('error'); }
      }
    }

    connect();
    return () => { cancelled = true; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, phase]);

  // Call timer while live.
  useEffect(() => {
    if (phase !== 'live') return;
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  function cleanup() {
    try { localStreamRef.current?.getTracks?.().forEach((t: any) => t.stop()); } catch {}
    try { pcRef.current?.close?.(); } catch {}
    try { InCallManager.stop(); } catch {}
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function toggleSpeaker() {
    const next = !speaker;
    try { InCallManager.setForceSpeakerphoneOn(next); } catch {}
    setSpeaker(next);
  }

  function toggleMute() {
    const tracks = localStreamRef.current?.getAudioTracks?.() || [];
    const next = !muted;
    tracks.forEach((t: any) => { t.enabled = !next; });
    setMuted(next);
  }

  async function hangUp() {
    cleanup();
    setPhase('ended');
    if (aiSessionIdRef.current) { try { await endSession(aiSessionIdRef.current).unwrap(); } catch {} }
    router.back();
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <LinearGradient colors={['#0f2744', '#1A3C5E', '#17A589']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 52 }}>{listenerEmoji}</Text>
        </View>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>{listenerName}</Text>

        {phase === 'select' && (
          <View style={{ alignItems: 'center', marginTop: 22, width: '100%' }}>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, marginBottom: 14 }}>Choose a voice</Text>
            <View style={{ width: '100%', gap: 10 }}>
              {VOICES.map((v) => {
                const active = voice === v.id;
                return (
                  <TouchableOpacity key={v.id} onPress={() => setVoice(v.id)}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      backgroundColor: active ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)',
                      borderWidth: active ? 2 : 1, borderColor: active ? '#fff' : 'rgba(255,255,255,0.25)',
                      borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14 }}>
                    <View>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{v.label}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{v.hint}</Text>
                    </View>
                    <Text style={{ fontSize: 18 }}>{active ? '✓' : ''}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity onPress={() => setPhase('connecting')}
              style={{ marginTop: 22, backgroundColor: '#17A589', borderRadius: 26, paddingVertical: 15, paddingHorizontal: 44 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>📞 Start call</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'connecting' && (
          <View style={{ alignItems: 'center', marginTop: 18 }}>
            <ActivityIndicator color="#fff" />
            <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 10, fontSize: 15 }}>Connecting your call…</Text>
          </View>
        )}

        {phase === 'live' && (
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 40, fontWeight: '700', marginTop: 16, letterSpacing: 2 }}>{mm}:{ss}</Text>
        )}

        {phase === 'error' && (
          <Text style={{ color: '#FECACA', fontSize: 15, marginTop: 18, textAlign: 'center' }}>{error}</Text>
        )}

        {phase !== 'select' && (
        <View style={{ flexDirection: 'row', gap: 20, marginTop: 40 }}>
          {phase === 'live' && (
            <TouchableOpacity onPress={toggleMute} style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: muted ? 'rgba(231,76,60,0.35)' : 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 26 }}>{muted ? '🔇' : '🎤'}</Text>
            </TouchableOpacity>
          )}
          {phase === 'live' && (
            <TouchableOpacity onPress={toggleSpeaker} style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: speaker ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 26 }}>{speaker ? '🔊' : '🔈'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={hangUp} style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.dangerRed, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 26 }}>📞</Text>
          </TouchableOpacity>
        </View>
        )}
        {phase !== 'select' && (
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 16 }}>{phase === 'error' ? 'Tap to go back' : 'Tap the red button to end the call'}</Text>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}
