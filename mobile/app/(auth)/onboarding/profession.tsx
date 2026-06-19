import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../src/constants/colors';
import { useUpdateMeMutation } from '../../../src/store/api/apiSlice';

const PROFESSIONS = ['Student', 'Professional', 'Entrepreneur', 'Healthcare', 'Creative', 'Parent / Caregiver', 'Retired', 'Other'];

export default function ProfessionScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [other, setOther] = useState('');
  const [updateMe, { isLoading }] = useUpdateMeMutation();

  const handleNext = async () => {
    const profession = selected === 'Other' ? other || 'Other' : selected;
    if (!profession) return;
    await updateMe({ profession });
    router.push('/(auth)/onboarding/category');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ padding: 24, flex: 1 }}>
        <View style={{ height: 4, backgroundColor: Colors.primaryLight, borderRadius: 2, marginBottom: 24 }}>
          <View style={{ width: '50%', height: 4, backgroundColor: Colors.primaryMid, borderRadius: 2 }} />
        </View>
        <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 8 }}>Step 2 of 4</Text>
        <Text style={{ fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 }}>What best describes you?</Text>
        <Text style={{ fontSize: 16, color: Colors.textSecondary, marginBottom: 24, lineHeight: 22 }}>
          Helps us understand your context — never shared externally.
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {PROFESSIONS.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setSelected(p)}
              style={{
                borderWidth: 2,
                borderColor: selected === p ? Colors.primaryMid : Colors.border,
                borderRadius: 24, paddingHorizontal: 18, paddingVertical: 10,
                backgroundColor: selected === p ? Colors.primaryLight : Colors.surface,
              }}
            >
              <Text style={{ color: selected === p ? Colors.primaryDark : Colors.textSecondary, fontWeight: '600' }}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selected === 'Other' && (
          <TextInput
            value={other} onChangeText={setOther}
            placeholder="Tell us more..."
            style={{ marginTop: 16, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 16, backgroundColor: Colors.surface }}
            placeholderTextColor={Colors.textSecondary}
          />
        )}

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          onPress={handleNext} disabled={!selected || isLoading}
          style={{ backgroundColor: selected ? Colors.primaryMid : Colors.textSecondary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
        >
          <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '700' }}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
