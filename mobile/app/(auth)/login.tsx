import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/colors';
import { useLoginMutation } from '../../src/store/api/apiSlice';
import { useAppDispatch } from '../../src/store';
import { setCredentials } from '../../src/store/authSlice';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();

  const handleLogin = async () => {
    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setCredentials(result));
      if (!result.user.age_segment) {
        router.replace('/(auth)/onboarding/age-group');
      } else {
        router.replace('/(app)');
      }
    } catch (err: any) {
      Alert.alert('Sign in failed', err?.data?.error || 'Please check your credentials and try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ color: Colors.primaryMid, fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 28, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 }}>Welcome back</Text>
        <Text style={{ fontSize: 16, color: Colors.textSecondary, marginBottom: 40 }}>
          Sign in to continue your journey.
        </Text>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 }}>Email</Text>
          <TextInput
            value={email} onChangeText={setEmail}
            placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none"
            style={{ backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 16, color: Colors.textPrimary }}
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 }}>Password</Text>
          <TextInput
            value={password} onChangeText={setPassword}
            placeholder="Your password" secureTextEntry
            style={{ backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 16, color: Colors.textPrimary }}
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        <TouchableOpacity
          onPress={handleLogin} disabled={isLoading}
          style={{ backgroundColor: Colors.primaryMid, borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
        >
          <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '700' }}>{isLoading ? 'Signing in…' : 'Sign In'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ color: Colors.primaryMid, fontSize: 15 }}>Don't have an account? Get started</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
