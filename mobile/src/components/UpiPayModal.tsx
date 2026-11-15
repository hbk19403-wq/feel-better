import { View, Text, TouchableOpacity, Image, TextInput, Modal, Linking, Alert, ScrollView } from 'react-native';
import { Colors } from '../constants/colors';

interface Order {
  amount_inr: number;
  payee_vpa: string;
  upi_uri: string;
  qr_data_url?: string;
}

// Shared UPI payment sheet: QR + open-app deep link + UTR confirm.
export default function UpiPayModal({
  order, subtitle, utr, onChangeUtr, onConfirm, onCancel, busy,
}: {
  order: Order | null;
  subtitle?: string;
  utr: string;
  onChangeUtr: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  return (
    <Modal visible={!!order} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' }}>
          <ScrollView>
            <Text style={{ fontSize: 20, fontWeight: '800', textAlign: 'center' }}>Pay ₹{order?.amount_inr}</Text>
            {subtitle ? <Text style={{ fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 16 }}>{subtitle}</Text> : <View style={{ height: 12 }} />}
            {order?.qr_data_url ? (
              <Image source={{ uri: order.qr_data_url }} style={{ width: 210, height: 210, alignSelf: 'center', borderRadius: 12, borderWidth: 1, borderColor: Colors.border }} />
            ) : null}
            <Text style={{ textAlign: 'center', marginVertical: 12, color: Colors.textSecondary }}>Paying to <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>{order?.payee_vpa}</Text></Text>
            <TouchableOpacity onPress={() => order?.upi_uri && Linking.openURL(order.upi_uri).catch(() => Alert.alert('No UPI app', 'Install a UPI app or scan the QR.'))}
              style={{ backgroundColor: Colors.primaryMid, borderRadius: 22, paddingVertical: 13, alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>📲 Open UPI app to pay</Text>
            </TouchableOpacity>
            <View style={{ borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 6 }}>After paying, enter your UPI reference / UTR</Text>
              <TextInput value={utr} onChangeText={onChangeUtr} placeholder="e.g. 4319XXXXXX12" placeholderTextColor={Colors.textSecondary} keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, marginBottom: 12 }} />
              <TouchableOpacity onPress={onConfirm} disabled={busy || utr.trim().length < 6}
                style={{ backgroundColor: Colors.accentTeal, borderRadius: 22, paddingVertical: 13, alignItems: 'center', opacity: busy || utr.trim().length < 6 ? 0.5 : 1 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{busy ? '…' : "I've paid"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onCancel} style={{ paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ color: Colors.textSecondary }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
