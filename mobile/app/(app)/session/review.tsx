import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, MOOD_LABELS } from '../../../src/constants/colors';
import { useReviewSessionMutation } from '../../../src/store/api/apiSlice';

export default function SessionReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [moodAfter, setMoodAfter] = useState<number | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [reviewSession, { isLoading }] = useReviewSessionMutation();

  const handleSubmit = async () => {
    if (!moodAfter || !rating) return;
    await reviewSession({ id: id!, rating, mood_after: moodAfter, comment: comment || undefined });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 64, marginBottom: 24 }}>🫂</Text>
        <Text style={{ fontSize: 26, fontWeight: '700', color: Colors.primaryDark, textAlign: 'center', marginBottom: 12 }}>
          Thank you for reaching out.
        </Text>
        <Text style={{ fontSize: 17, color: Colors.textSecondary, textAlign: 'center', lineHeight: 26, marginBottom: 40 }}>
          You did something brave today. Your wellbeing matters, and we're here whenever you need us.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(app)')}
          style={{ backgroundColor: Colors.primaryMid, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 48 }}
        >
          <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '700' }}>Back Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/(app)/match')}
          style={{ marginTop: 14, padding: 14 }}
        >
          <Text style={{ color: Colors.primaryMid, fontSize: 15 }}>Book another session</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={{ fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 }}>
          How did it go?
        </Text>
        <Text style={{ fontSize: 16, color: Colors.textSecondary, marginBottom: 32, lineHeight: 22 }}>
          Your feedback helps us match you better next time.
        </Text>

        {/* Mood after */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 }}>How do you feel now?</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {[1, 2, 3, 4, 5].map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMoodAfter(m)}
                style={{
                  width: 56, height: 56, borderRadius: 28,
                  backgroundColor: moodAfter === m ? Colors.primaryLight : Colors.background,
                  borderWidth: 2, borderColor: moodAfter === m ? Colors.primaryMid : Colors.border,
                  alignItems: 'center', justifyContent: 'center',
                }}
                accessibilityLabel={`Mood ${m}`}
              >
                <Text style={{ fontSize: 26 }}>{MOOD_LABELS[m]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rating */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 }}>Rate your listener</Text>
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity key={s} onPress={() => setRating(s)} accessibilityLabel={`${s} stars`}>
                <Text style={{ fontSize: 36, color: s <= (rating ?? 0) ? Colors.warningAmber : Colors.border }}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Comment */}
        <View style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: 20, marginBottom: 32 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 }}>Leave a note (optional)</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="What was helpful? What could be better?"
            multiline numberOfLines={4}
            style={{
              borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 14,
              fontSize: 15, color: Colors.textPrimary, minHeight: 100, textAlignVertical: 'top',
            }}
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!moodAfter || !rating || isLoading}
          style={{
            backgroundColor: moodAfter && rating ? Colors.primaryMid : Colors.textSecondary,
            borderRadius: 14, paddingVertical: 16, alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '700' }}>
            {isLoading ? 'Submitting…' : 'Submit Feedback'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(app)')} style={{ alignItems: 'center', marginTop: 16 }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 15 }}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
