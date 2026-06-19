import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, SUPPORT_CATEGORIES } from '../../src/constants/colors';
import { useGetResourcesQuery } from '../../src/store/api/apiSlice';

const TYPES = ['article', 'audio', 'workbook', 'ebook'];
const TYPE_EMOJI: Record<string, string> = { article: '📄', audio: '🎧', workbook: '📓', ebook: '📖' };

export default function ResourcesScreen() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const { data: resources, isLoading } = useGetResourcesQuery({
    search: search.length > 2 ? search : undefined,
    type: filterType ?? undefined,
    category: filterCategory ?? undefined,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 }}>Resource Library</Text>

        <TextInput
          value={search} onChangeText={setSearch}
          placeholder="Search articles, audio, workbooks…"
          style={{ backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16 }}
          placeholderTextColor={Colors.textSecondary}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setFilterType(filterType === t ? null : t)}
              style={{
                borderWidth: 1.5, borderColor: filterType === t ? Colors.primaryMid : Colors.border,
                borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
                backgroundColor: filterType === t ? Colors.primaryLight : Colors.surface,
              }}
            >
              <Text style={{ color: filterType === t ? Colors.primaryDark : Colors.textSecondary, fontWeight: '600', fontSize: 13 }}>
                {TYPE_EMOJI[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading ? (
          <ActivityIndicator color={Colors.primaryMid} style={{ marginTop: 48 }} />
        ) : resources?.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 48 }}>
            <Text style={{ fontSize: 36 }}>📭</Text>
            <Text style={{ fontSize: 16, color: Colors.textSecondary, marginTop: 12 }}>No resources found.</Text>
          </View>
        ) : (
          <View style={{ gap: 12, marginTop: 8 }}>
            {resources?.map((r: any) => (
              <View
                key={r.id}
                style={{
                  backgroundColor: Colors.surface, borderRadius: 14, padding: 16,
                  borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', gap: 14, alignItems: 'center',
                }}
              >
                <View style={{
                  width: 52, height: 52, borderRadius: 12, backgroundColor: Colors.primaryLight,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 26 }}>{TYPE_EMOJI[r.type]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary, lineHeight: 20 }}>{r.title}</Text>
                  <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 4 }}>
                    {r.type.charAt(0).toUpperCase() + r.type.slice(1)} · {r.duration_minutes} min
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
