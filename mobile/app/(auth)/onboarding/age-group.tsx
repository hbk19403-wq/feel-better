import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, AGE_SEGMENTS } from '../../../src/constants/colors';
import { useUpdateMeMutation } from '../../../src/store/api/apiSlice';
import { useAppDispatch } from '../../../src/store';
import { updateUser } from '../../../src/store/authSlice';

export default function AgeGroupScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [updateMe, { isLoading }] = useUpdateMeMutation();
  const dispatch = useAppDispatch();

  const handleNext = async () => {
    if (!selected) return;
    await updateMe({ age_segment: selected });
    dispatch(updateUser({ age_segment: selected }));
    router.push('/(auth)/onboarding/profession');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View style={{ marginBottom: 12 }}>
          <View style={{ height: 4, backgroundColor: Colors.primaryLight, borderRadius: 2, marginBottom: 24 }}>
            <View style={{ width: '25%', height: 4, backgroundColor: Colors.primaryMid, borderRadius: 2 }} />
          </View>
          <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 8 }}>Step 1 of 4</Text>
          <Text style={{ fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 }}>
            How old are you?
          </Text>
          <Text style={{ fontSize: 16, color: Colors.textSecondary, lineHeight: 22 }}>
            This helps us match you with listeners who understand your life stage.
          </Text>
        </View>

        <View style={{ gap: 12, marginTop: 24 }}>
          {AGE_SEGMENTS.map((seg) => (
            <TouchableOpacity
              key={seg.id}
              onPress={() => setSelected(seg.id)}
              style={{
                borderWidth: 2,
                borderColor: selected === seg.id ? Colors.primaryMid : Colors.border,
                borderRadius: 14, padding: 18,
                backgroundColor: selected === seg.id ? Colors.primaryLight : Colors.surface,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              }}
              accessibilityLabel={seg.label}
            >
              <View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.primaryDark }}>{seg.label}</Text>
                <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 2 }}>{seg.description}</Text>
              </View>
              {selected === seg.id && (
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primaryMid, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#FFF', fontSize: 14 }}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleNext} disabled={!selected || isLoading}
          style={{
            marginTop: 32,
            backgroundColor: selected ? Colors.primaryMid : Colors.textSecondary,
            borderRadius: 14, paddingVertical: 16, alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '700' }}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
