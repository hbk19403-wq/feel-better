import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../src/constants/colors';
import { useUpdateMeMutation } from '../../../src/store/api/apiSlice';
import { useAppDispatch } from '../../../src/store';
import { setOnboardingComplete, updateUser } from '../../../src/store/authSlice';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'zh', label: 'Mandarin', flag: '🇨🇳' },
  { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { code: 'pt', label: 'Portuguese', flag: '🇧🇷' },
];

export default function LanguageScreen() {
  const [selected, setSelected] = useState('en');
  const [updateMe, { isLoading }] = useUpdateMeMutation();
  const dispatch = useAppDispatch();
  const { category } = useLocalSearchParams<{ category: string }>();

  const handleFinish = async () => {
    await updateMe({ language_preference: selected });
    dispatch(updateUser({ language_preference: selected }));
    dispatch(setOnboardingComplete());
    router.replace('/(app)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View style={{ height: 4, backgroundColor: Colors.primaryMid, borderRadius: 2, marginBottom: 24 }} />
        <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 8 }}>Step 4 of 4 — Almost there!</Text>
        <Text style={{ fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 }}>
          Preferred language for sessions?
        </Text>
        <Text style={{ fontSize: 16, color: Colors.textSecondary, marginBottom: 24, lineHeight: 22 }}>
          We'll match you with listeners who speak your language.
        </Text>

        <View style={{ gap: 10 }}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              onPress={() => setSelected(lang.code)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                borderWidth: 2, borderColor: selected === lang.code ? Colors.primaryMid : Colors.border,
                borderRadius: 14, padding: 16,
                backgroundColor: selected === lang.code ? Colors.primaryLight : Colors.surface,
              }}
            >
              <Text style={{ fontSize: 28 }}>{lang.flag}</Text>
              <Text style={{ fontSize: 17, fontWeight: '600', color: Colors.textPrimary, flex: 1 }}>{lang.label}</Text>
              {selected === lang.code && (
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primaryMid, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#FFF', fontSize: 12 }}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleFinish} disabled={isLoading}
          style={{ marginTop: 24, backgroundColor: Colors.accentTeal, borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
        >
          <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '700' }}>
            {isLoading ? 'Saving…' : "Let's Get Started →"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
