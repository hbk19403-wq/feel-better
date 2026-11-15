import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../../src/constants/colors';
import UpiPayModal from '../../../src/components/UpiPayModal';
import { useGetSessionQuery, useEndSessionMutation, useSettleSessionMutation, useConfirmSettleMutation } from '../../../src/store/api/apiSlice';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function InCallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [endSession] = useEndSessionMutation();
  const [settleSession] = useSettleSessionMutation();
  const [confirmSettle] = useConfirmSettleMutation();
  const [settleDue, setSettleDue] = useState(0);
  const [settleOrder, setSettleOrder] = useState<any | null>(null);
  const [settleUtr, setSettleUtr] = useState('');
  const [settleBusy, setSettleBusy] = useState(false);
  const { data: session } = useGetSessionQuery(id!);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (elapsed === 25 * 60) {
      Alert.alert('Session at 25 minutes', 'Would you like to extend your session?', [
        { text: 'End Session', style: 'destructive', onPress: handleEnd },
        { text: 'Continue', style: 'default' },
      ]);
    }
  }, [elapsed]);

  const goReview = () => router.replace({ pathname: '/(app)/session/review', params: { id } });

  const handleEnd = async () => {
    clearInterval(intervalRef.current);
    try {
      const res: any = await endSession(id!).unwrap();
      const due = Math.round(Number(res?.billing?.amount_inr) || 0);
      if (due > 0) { setSettleDue(due); return; } // show settle before review
      goReview();
    } catch {
      goReview();
    }
  };

  async function startSettle() {
    setSettleBusy(true);
    try {
      const d: any = await settleSession(id!).unwrap();
      if (d.nothing_due) { goReview(); return; }
      setSettleOrder(d); setSettleUtr('');
    } catch {} finally { setSettleBusy(false); }
  }

  async function doConfirmSettle() {
    if (!settleOrder) return;
    setSettleBusy(true);
    try {
      await confirmSettle({ id: id!, txn_ref: settleOrder.txn_ref, upi_txn_id: settleUtr.trim() }).unwrap();
      goReview();
    } catch {} finally { setSettleBusy(false); }
  }

  const confirmEnd = () => {
    Alert.alert('End session?', 'Are you sure you want to end this session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Session', style: 'destructive', onPress: handleEnd },
    ]);
  };

  return (
    <LinearGradient colors={['#17A589', '#1A3C5E', '#0D2137']} style={{ flex: 1 }}>
      {showCrisis && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100,
          alignItems: 'center', justifyContent: 'center', padding: 32,
        }}>
          <Text style={{ fontSize: 32, marginBottom: 16 }}>🛡️</Text>
          <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>
            You're Not Alone
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center', fontSize: 16, lineHeight: 24, marginBottom: 32 }}>
            If you're in crisis, please reach out to these free resources available 24/7:
          </Text>
          {[
            { name: '988 Suicide & Crisis Lifeline', detail: 'Call or text 988' },
            { name: 'Crisis Text Line', detail: 'Text HOME to 741741' },
            { name: 'Emergency Services', detail: 'Call 911' },
          ].map((r) => (
            <View key={r.name} style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, marginBottom: 10, width: '100%' }}>
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>{r.name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 2 }}>{r.detail}</Text>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setShowCrisis(false)}
            style={{ marginTop: 16, padding: 14 }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>Return to session</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ flex: 1, padding: 24, paddingTop: 60, alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Top bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '600' }}>
              🔴 {formatTime(elapsed)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowCrisis(true)}
            style={{ backgroundColor: 'rgba(231,76,60,0.3)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}
            accessibilityLabel="Crisis resources"
          >
            <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>🛡️ Safety</Text>
          </TouchableOpacity>
        </View>

        {/* Listener avatar */}
        <View style={{ alignItems: 'center' }}>
          <View style={{
            width: 120, height: 120, borderRadius: 60,
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
            alignItems: 'center', justifyContent: 'center', marginBottom: 20,
          }}>
            <Text style={{ fontSize: 52 }}>🎧</Text>
          </View>
          <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '700' }}>
            {session?.listener_alias ?? 'Your Listener'}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, marginTop: 6 }}>
            Here to listen — confidentially
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accentTeal }} />
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>End-to-end encrypted</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={{ width: '100%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 24 }}>
            <TouchableOpacity
              onPress={() => setMuted(!muted)}
              style={{
                width: 64, height: 64, borderRadius: 32,
                backgroundColor: muted ? Colors.dangerRed : 'rgba(255,255,255,0.2)',
                alignItems: 'center', justifyContent: 'center',
              }}
              accessibilityLabel={muted ? 'Unmute' : 'Mute'}
            >
              <Text style={{ fontSize: 26 }}>{muted ? '🔇' : '🎙️'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={confirmEnd}
              style={{
                width: 72, height: 72, borderRadius: 36,
                backgroundColor: Colors.dangerRed,
                alignItems: 'center', justifyContent: 'center',
              }}
              accessibilityLabel="End call"
            >
              <Text style={{ fontSize: 28 }}>📵</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                width: 64, height: 64, borderRadius: 32,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center', justifyContent: 'center',
              }}
              accessibilityLabel="Speaker"
            >
              <Text style={{ fontSize: 26 }}>🔊</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 12 }}>
            Anonymous mode active • {session?.user_alias ?? 'Anonymous'}
          </Text>
        </View>
      </View>

      {/* Settle prompt (before the UPI sheet) */}
      {settleDue > 0 && !settleOrder && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <View style={{ backgroundColor: Colors.surface, borderRadius: 20, padding: 26, width: '100%', alignItems: 'center' }}>
            <Text style={{ fontSize: 40 }}>🧾</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', marginTop: 6 }}>Settle your session</Text>
            <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' }}>Your live session was ₹1/min.</Text>
            <Text style={{ fontSize: 40, fontWeight: '800', marginVertical: 10 }}>₹{settleDue}</Text>
            <TouchableOpacity onPress={startSettle} disabled={settleBusy} style={{ backgroundColor: Colors.primaryMid, borderRadius: 22, paddingVertical: 13, alignItems: 'center', width: '100%', opacity: settleBusy ? 0.6 : 1 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{settleBusy ? '…' : `Pay ₹${settleDue} via UPI`}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goReview} style={{ paddingVertical: 12 }}>
              <Text style={{ color: Colors.textSecondary }}>Pay later</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <UpiPayModal order={settleOrder} subtitle="Live listener session" utr={settleUtr}
        onChangeUtr={setSettleUtr} onConfirm={doConfirmSettle} onCancel={goReview} busy={settleBusy} />
    </LinearGradient>
  );
}
