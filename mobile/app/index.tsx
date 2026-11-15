import { useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../src/constants/colors';
import { useAppDispatch } from '../src/store';
import { setTokens, hydrateUser } from '../src/store/authSlice';
import { api } from '../src/store/api/apiSlice';

export default function SplashScreen() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const init = async () => {
      await new Promise((r) => setTimeout(r, 1800));
      try {
        const token = await SecureStore.getItemAsync('accessToken');
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!token) { router.replace('/(auth)'); return; }

        // Put the stored token back into state, then fetch the user. If the
        // access token has expired, the reauth wrapper silently refreshes it;
        // only if that fails do we fall back to the auth flow.
        dispatch(setTokens({ accessToken: token, refreshToken }));
        try {
          const me = await dispatch(api.endpoints.getMe.initiate(undefined, { forceRefetch: true })).unwrap();
          dispatch(hydrateUser(me));
          router.replace('/(app)');
        } catch {
          router.replace('/(auth)');
        }
      } catch {
        router.replace('/(auth)');
      }
    };
    init();
  }, []);

  return (
    <LinearGradient colors={[Colors.primaryDark, '#0D2137']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', gap: 16 }}>
        <View
          style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: Colors.accentTeal,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 36 }}>🫂</Text>
        </View>
        <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '700', letterSpacing: -0.5 }}>
          1800-FeelBetter
        </Text>
        <Text style={{ color: Colors.primaryLight, fontSize: 16, textAlign: 'center', paddingHorizontal: 32 }}>
          Compassionate, Confidential,{'\n'}Judgment-Free Support
        </Text>
      </View>
    </LinearGradient>
  );
}
