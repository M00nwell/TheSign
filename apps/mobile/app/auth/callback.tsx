import { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

/**
 * This screen exists solely to satisfy Expo Router when the OS opens the app
 * via the deep link `the-sign://auth/callback?code=...` after Google OAuth.
 *
 * Expo Router matches the URL path to a file — without this file it shows
 * "Unmatched Route". This screen grabs the `code` param, exchanges it for a
 * Supabase session, then immediately redirects to the home screen.
 */
export default function AuthCallback() {
    const router = useRouter();
    const { code } = useLocalSearchParams<{ code: string }>();

    useEffect(() => {
        const handleCallback = async () => {
            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(
                    Array.isArray(code) ? code[0] : code
                );
                if (error) {
                    console.error('[AuthCallback] Session exchange failed:', error.message);
                }
            }
            // Always navigate home — session state update fires onAuthStateChange
            router.replace('/');
        };

        handleCallback();
    }, [code]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0828' }}>
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 16, fontSize: 13 }}>
                Signing in…
            </Text>
        </View>
    );
}
