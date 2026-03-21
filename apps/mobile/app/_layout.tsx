import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

// Import your global CSS file
import "../global.css";

export default function Layout() {
    const [session, setSession] = useState<Session | null>(null);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setInitialized(true);
            }
        );
        return () => subscription.unsubscribe();
    }, []);

    // OAuth deep link callback is handled by app/auth/callback.tsx —
    // Expo Router matches `the-sign://auth/callback?code=...` to that file,
    // which exchanges the code and redirects to `/`. No listener needed here.

    if (!initialized) {
        return (
            <View className="flex-1 justify-center items-center bg-[#0a0a0a]">
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <Slot />
            </GestureHandlerRootView>
        </SafeAreaProvider>
    );
}
