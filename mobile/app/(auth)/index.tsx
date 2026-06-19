import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/colors';

export default function AuthLanding() {
  return (
    <LinearGradient colors={[Colors.primaryDark, '#122840']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
          <View style={{ alignItems: 'center', marginTop: 48 }}>
            <View
              style={{
                width: 88, height: 88, borderRadius: 44,
                backgroundColor: Colors.accentTeal,
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <Text style={{ fontSize: 40 }}>🫂</Text>
            </View>
            <Text style={{ color: '#FFF', fontSize: 32, fontWeight: '700', textAlign: 'center', letterSpacing: -0.5 }}>
              1800-FeelBetter
            </Text>
            <Text style={{ color: Colors.primaryLight, fontSize: 16, textAlign: 'center', marginTop: 12, lineHeight: 24 }}>
              You're not alone. Connect with a compassionate listener — confidentially, on your terms.
            </Text>
          </View>

          <View style={{ gap: 12, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
              {[
                { icon: '🔒', label: 'Confidential' },
                { icon: '🤝', label: 'Human Listeners' },
                { icon: '⚡', label: 'On Demand' },
              ].map((item) => (
                <View key={item.label} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                  <Text style={{ color: Colors.primaryLight, fontSize: 12, textAlign: 'center' }}>{item.label}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
              style={{
                backgroundColor: Colors.accentTeal, borderRadius: 14,
                paddingVertical: 16, alignItems: 'center',
              }}
              accessibilityLabel="Get started"
            >
              <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '700' }}>Get Started — It's Free</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              style={{
                borderWidth: 1.5, borderColor: Colors.primaryLight,
                borderRadius: 14, paddingVertical: 16, alignItems: 'center',
              }}
              accessibilityLabel="Sign in"
            >
              <Text style={{ color: Colors.primaryLight, fontSize: 17, fontWeight: '600' }}>Sign In</Text>
            </TouchableOpacity>

            <Text style={{ color: Colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
              By continuing you agree to our Terms of Service and Privacy Policy.{'\n'}
              All sessions are confidential. We never share your data.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
