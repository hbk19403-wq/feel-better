import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, SUPPORT_CATEGORIES } from '../../../src/constants/colors';

export default function CategoryScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View style={{ height: 4, backgroundColor: Colors.primaryLight, borderRadius: 2, marginBottom: 24 }}>
          <View style={{ width: '75%', height: 4, backgroundColor: Colors.primaryMid, borderRadius: 2 }} />
        </View>
        <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 8 }}>Step 3 of 4</Text>
        <Text style={{ fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 }}>What would you like support with?</Text>
        <Text style={{ fontSize: 16, color: Colors.textSecondary, marginBottom: 24, lineHeight: 22 }}>
          Select what feels most relevant today. You can always change this later.
        </Text>

        <View style={{ gap: 10 }}>
          {SUPPORT_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelected(cat.id)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                borderWidth: 2,
                borderColor: selected === cat.id ? Colors.primaryMid : Colors.border,
                borderRadius: 14, padding: 16,
                backgroundColor: selected === cat.id ? Colors.primaryLight : Colors.surface,
              }}
            >
              <Text style={{ fontSize: 22 }}>{cat.emoji}</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: selected === cat.id ? Colors.primaryDark : Colors.textPrimary, flex: 1 }}>
                {cat.label}
              </Text>
              {selected === cat.id && (
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primaryMid, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#FFF', fontSize: 12 }}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => selected && router.push({ pathname: '/(auth)/onboarding/language', params: { category: selected } })}
          disabled={!selected}
          style={{ marginTop: 24, backgroundColor: selected ? Colors.primaryMid : Colors.textSecondary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
        >
          <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '700' }}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
