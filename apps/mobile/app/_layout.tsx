import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

// Import your global CSS file
import "../global.css";

export default function Layout() {
    const [session, setSession] = useState<Session | null>(null);
    const [initialized, setInitialized] = useState(false);
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setSession(session);
                setInitialized(true);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!initialized) return;

        const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';

        if (!session && !inAuthGroup) {
            router.replace('/login');
        } else if (session && inAuthGroup) {
            router.replace('/');
        }
    }, [session, segments, initialized]);

    if (!initialized) {
        return (
            <View className="flex-1 justify-center items-center bg-[#0a0a0a]">
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    return <Slot />;
}
