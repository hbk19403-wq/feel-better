import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, TextInput, Modal, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { useGetPlansQuery, useGetSubscriptionQuery, useCheckoutPlanMutation, useConfirmPaymentMutation } from '../../src/store/api/apiSlice';

const GRADS: Record<string, [string, string]> = {
  free: ['#64748B', '#475569'], basic: ['#2E75B6', '#1A3C5E'],
  standard: ['#17A589', '#0e7a5f'], premium: ['#8B5CF6', '#6D28D9'],
};

export default function PlansScreen() {
  const { data: plans, isLoading } = useGetPlansQuery();
  const { data: me } = useGetSubscriptionQuery();
  const [checkout, { isLoading: checkingOut }] = useCheckoutPlanMutation();
  const [confirmPayment, { isLoading: confirming }] = useConfirmPaymentMutation();

  const [order, setOrder] = useState<any | null>(null);
  const [utr, setUtr] = useState('');

  async function startCheckout(planId: string) {
    try { const o: any = await checkout(planId).unwrap(); setOrder(o); setUtr(''); }
    catch (e: any) { Alert.alert('Checkout failed', e?.data?.error || 'Please try again.'); }
  }

  async function confirm() {
    if (!order) return;
    try {
      const res: any = await confirmPayment({ txn_ref: order.txn_ref, upi_txn_id: utr.trim() }).unwrap();
      setOrder(null);
      Alert.alert('Success', res?.message || 'Plan activated!');
    } catch (e: any) {
      Alert.alert('Could not confirm', e?.data?.error || 'Please check the reference and try again.');
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical: 6 }}>
          <Text style={{ color: Colors.primaryMid, fontWeight: '600', fontSize: 15 }}>← Back</Text>
        </TouchableOpacity>

        <LinearGradient colors={['#1A3C5E', '#17A589']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 20, padding: 24, marginBottom: 20 }}>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>PLANS</Text>
          <Text style={{ color: '#fff', fontSize: 23, fontWeight: '800', marginTop: 8 }}>Support that fits your budget</Text>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 6, lineHeight: 20 }}>Full access is free — advisory just ₹1/min. Pay securely over UPI.</Text>
          {me?.plan_name ? <Text style={{ color: '#fff', fontSize: 13, marginTop: 12, fontWeight: '700' }}>Current plan: {me.plan_name}</Text> : null}
        </LinearGradient>

        {isLoading ? <ActivityIndicator color={Colors.primaryMid} style={{ marginTop: 40 }} /> : (
          <View style={{ gap: 14 }}>
            {(plans || []).map((p: any) => {
              const [c1, c2] = GRADS[p.id] || GRADS.basic;
              const isCurrent = me?.plan === p.id;
              return (
                <View key={p.id} style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.surface, borderWidth: p.highlight ? 2 : 1, borderColor: p.highlight ? Colors.accentTeal : Colors.border }}>
                  <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 18 }}>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{p.name}</Text>
                    <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 2 }}>₹{p.price_inr}<Text style={{ fontSize: 14, fontWeight: '600' }}>{p.price_inr > 0 ? '/mo' : ''}</Text></Text>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12.5 }}>{p.tagline}</Text>
                  </LinearGradient>
                  <View style={{ padding: 16, gap: 8 }}>
                    {(p.features || []).map((f: string) => (
                      <Text key={f} style={{ fontSize: 13, color: Colors.textSecondary, lineHeight: 18 }}>✓ {f}</Text>
                    ))}
                    {isCurrent ? (
                      <View style={{ marginTop: 8, borderWidth: 1, borderColor: Colors.border, borderRadius: 22, paddingVertical: 11, alignItems: 'center' }}>
                        <Text style={{ color: Colors.textSecondary, fontWeight: '700' }}>Current plan</Text>
                      </View>
                    ) : p.price_inr > 0 ? (
                      <TouchableOpacity onPress={() => startCheckout(p.id)} disabled={checkingOut}
                        style={{ marginTop: 8, backgroundColor: c1, borderRadius: 22, paddingVertical: 12, alignItems: 'center', opacity: checkingOut ? 0.6 : 1 }}>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>{checkingOut ? '…' : `Pay ₹${p.price_inr} via UPI`}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* UPI payment modal */}
      <Modal visible={!!order} transparent animationType="slide" onRequestClose={() => setOrder(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' }}>
            <ScrollView>
              <Text style={{ fontSize: 20, fontWeight: '800', textAlign: 'center' }}>Pay ₹{order?.amount_inr} for {order?.plan_name}</Text>
              <Text style={{ fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 16 }}>Scan the QR with any UPI app, or tap to open it.</Text>
              {order?.qr_data_url ? (
                <Image source={{ uri: order.qr_data_url }} style={{ width: 220, height: 220, alignSelf: 'center', borderRadius: 12, borderWidth: 1, borderColor: Colors.border }} />
              ) : null}
              <Text style={{ textAlign: 'center', marginVertical: 12, color: Colors.textSecondary }}>Paying to <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>{order?.payee_vpa}</Text></Text>
              <TouchableOpacity onPress={() => order?.upi_uri && Linking.openURL(order.upi_uri).catch(() => Alert.alert('No UPI app', 'Install a UPI app or scan the QR.'))}
                style={{ backgroundColor: Colors.primaryMid, borderRadius: 22, paddingVertical: 13, alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>📲 Open UPI app to pay</Text>
              </TouchableOpacity>

              <View style={{ borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6 }}>After paying, enter your UPI reference / UTR</Text>
                <TextInput value={utr} onChangeText={setUtr} placeholder="e.g. 4319XXXXXX12" placeholderTextColor={Colors.textSecondary} keyboardType="numeric"
                  style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, marginBottom: 12 }} />
                <TouchableOpacity onPress={confirm} disabled={confirming || utr.trim().length < 6}
                  style={{ backgroundColor: Colors.accentTeal, borderRadius: 22, paddingVertical: 13, alignItems: 'center', opacity: confirming || utr.trim().length < 6 ? 0.5 : 1 }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{confirming ? '…' : "I've paid — activate my plan"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setOrder(null)} style={{ paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ color: Colors.textSecondary }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
