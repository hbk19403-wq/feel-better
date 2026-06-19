import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/colors';
import { useRegisterMutation } from '../../src/store/api/apiSlice';
import { useAppDispatch } from '../../src/store';
import { setCredentials } from '../../src/store/authSlice';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isMinor, setIsMinor] = useState(false);
  const [register, { isLoading }] = useRegisterMutation();
  const dispatch = useAppDispatch();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    try {
      const result = await register({ name, email, password, is_minor: isMinor }).unwrap();
      dispatch(setCredentials(result));
      router.replace('/(auth)/onboarding/age-group');
    } catch (err: any) {
      Alert.alert('Error', err?.data?.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 0 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ color: Colors.primaryMid, fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 28, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 }}>
          Create your account
        </Text>
        <Text style={{ fontSize: 16, color: Colors.textSecondary, marginBottom: 32, lineHeight: 22 }}>
          Your information stays private. We only use it to match you with the right listener.
        </Text>

        {[
          { label: 'Your name', value: name, setter: setName, placeholder: 'First name or alias', secure: false },
          { label: 'Email address', value: email, setter: setEmail, placeholder: 'you@example.com', secure: false },
          { label: 'Password', value: password, setter: setPassword, placeholder: '8+ characters', secure: true },
        ].map((field) => (
          <View key={field.label} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 }}>
              {field.label}
            </Text>
            <TextInput
              value={field.value}
              onChangeText={field.setter}
              placeholder={field.placeholder}
              secureTextEntry={field.secure}
              autoCapitalize={field.label === 'Email address' ? 'none' : 'words'}
              keyboardType={field.label === 'Email address' ? 'email-address' : 'default'}
              style={{
                backgroundColor: Colors.surface,
                borderWidth: 1.5, borderColor: Colors.border,
                borderRadius: 12, padding: 14, fontSize: 16,
                color: Colors.textPrimary,
              }}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
        ))}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.primaryDark }}>I am under 18</Text>
            <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 }}>A parental awareness notice will be shown</Text>
          </View>
          <Switch value={isMinor} onValueChange={setIsMinor} trackColor={{ true: Colors.primaryMid }} />
        </View>

        <TouchableOpacity
          onPress={handleRegister}
          disabled={isLoading}
          style={{
            backgroundColor: isLoading ? Colors.textSecondary : Colors.primaryMid,
            borderRadius: 14, paddingVertical: 16, alignItems: 'center',
          }}
          accessibilityLabel="Create account"
        >
          <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '700' }}>
            {isLoading ? 'Creating account…' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ color: Colors.primaryMid, fontSize: 15 }}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
