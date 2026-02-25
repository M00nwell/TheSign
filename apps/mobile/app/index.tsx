import { View, Text, Pressable, SafeAreaView, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { supabase } from '../lib/supabase';
import OmenCard from '../components/OmenCard';
import CardPackage from '../components/CardPackage';
import { useState, useEffect, useRef } from 'react';
import { Feather } from '@expo/vector-icons';
import SettingsModal from '../components/SettingsModal';
import ProfileModal from '../components/ProfileModal';
import LoginModal from '../components/LoginModal';
import { Session } from '@supabase/supabase-js';
import { shareAsync } from 'expo-sharing';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';

// ─── Time-of-day ambient palette ─────────────────────────────────────────────
// Each stop: hour (0–24), bg [r,g,b], g1 [r,g,b,a] top-left, g2 [r,g,b,a] btm-right
// All intentionally dark so the bright card is the focus.
const TIME_PALETTE = [
    { h: 0, bg: [10, 8, 45], g1: [90, 50, 220, 0.45], g2: [35, 18, 130, 0.38] }, // midnight — vivid indigo
    { h: 4, bg: [12, 10, 55], g1: [100, 55, 230, 0.48], g2: [45, 25, 155, 0.40] }, // deep night — violet
    { h: 5, bg: [22, 12, 75], g1: [140, 65, 240, 0.50], g2: [80, 35, 190, 0.42] }, // pre-dawn — purple surge
    { h: 6, bg: [40, 25, 90], g1: [200, 90, 55, 0.48], g2: [115, 55, 220, 0.44] }, // dawn — amber meets violet
    { h: 7, bg: [8, 28, 85], g1: [45, 100, 220, 0.50], g2: [28, 65, 170, 0.42] }, // sunrise — deep ocean blue
    { h: 9, bg: [6, 20, 65], g1: [28, 80, 195, 0.45], g2: [22, 55, 135, 0.36] }, // morning — cool blue
    { h: 12, bg: [16, 16, 28], g1: [45, 72, 155, 0.35], g2: [55, 58, 125, 0.28] }, // noon — muted blue-gray
    { h: 15, bg: [60, 28, 10], g1: [168, 78, 28, 0.48], g2: [105, 52, 18, 0.38] }, // afternoon — sienna
    { h: 17, bg: [90, 42, 8], g1: [240, 115, 22, 0.55], g2: [190, 65, 28, 0.48] }, // golden hour — vivid amber
    { h: 18, bg: [85, 12, 48], g1: [250, 52, 20, 0.58], g2: [180, 22, 125, 0.50] }, // sunset — crimson-magenta
    { h: 20, bg: [28, 12, 60], g1: [125, 35, 210, 0.50], g2: [82, 28, 175, 0.42] }, // dusk — twilight purple
    { h: 22, bg: [12, 10, 48], g1: [88, 48, 200, 0.42], g2: [35, 32, 140, 0.35] }, // night — dark indigo
    { h: 24, bg: [10, 8, 45], g1: [90, 50, 220, 0.45], g2: [35, 18, 130, 0.38] }, // midnight (wrap)
];

// ─── DEV: set to any hour (0–23) to preview that time's palette. null = real time.
const DEV_HOUR_OVERRIDE: number | null = null;

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function getAmbientTarget() {
    const now = new Date();
    const h = DEV_HOUR_OVERRIDE !== null
        ? DEV_HOUR_OVERRIDE
        : now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

    let i = TIME_PALETTE.findIndex(p => p.h >= h) - 1;
    i = Math.max(0, Math.min(i, TIME_PALETTE.length - 2));
    const a = TIME_PALETTE[i];
    const b = TIME_PALETTE[i + 1];
    const t = b.h === a.h ? 0 : (h - a.h) / (b.h - a.h);

    const ri = (x: number, y: number) => Math.round(lerp(x, y, t));
    const ra = (x: number, y: number) => lerp(x, y, t);

    return {
        bgR: ri(a.bg[0], b.bg[0]),
        bgG: ri(a.bg[1], b.bg[1]),
        bgB: ri(a.bg[2], b.bg[2]),
        g1R: ri(a.g1[0], b.g1[0]), g1G: ri(a.g1[1], b.g1[1]),
        g1B: ri(a.g1[2], b.g1[2]), g1A: ra(a.g1[3], b.g1[3]),
        g2R: ri(a.g2[0], b.g2[0]), g2G: ri(a.g2[1], b.g2[1]),
        g2B: ri(a.g2[2], b.g2[2]), g2A: ra(a.g2[3], b.g2[3]),
    };
}

const ANIM_CONFIG = { duration: 3000, easing: Easing.inOut(Easing.cubic) };

export default function Home() {
    const [language, setLanguage] = useState<'en' | 'zh'>('en');
    const [showSettings, setShowSettings] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [session, setSession] = useState<Session | null>(null);
    const [isPackageOpen, setIsPackageOpen] = useState(false);
    const omenCardRef = useRef<any>(null);

    // Shared values for smooth background color animation (bg only — no glow circles on mobile)
    const initial = getAmbientTarget();
    const bgR = useSharedValue(initial.bgR);
    const bgG = useSharedValue(initial.bgG);
    const bgB = useSharedValue(initial.bgB);

    const animateTo = (target: ReturnType<typeof getAmbientTarget>) => {
        bgR.value = withTiming(target.bgR, ANIM_CONFIG);
        bgG.value = withTiming(target.bgG, ANIM_CONFIG);
        bgB.value = withTiming(target.bgB, ANIM_CONFIG);
    };

    const bgStyle = useAnimatedStyle(() => ({
        backgroundColor: `rgb(${Math.round(bgR.value)},${Math.round(bgG.value)},${Math.round(bgB.value)})`,
    }));


    // Refresh ambient colors every minute
    useEffect(() => {
        const id = setInterval(() => animateTo(getAmbientTarget()), 60_000);
        return () => clearInterval(id);
    }, []);

    // Auth state
    useEffect(() => {
        // getSession can throw AuthApiError if a stale refresh token is stored on device.
        // Sign out to clear it so the user starts fresh.
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.warn('[Auth] Stale session, signing out:', error.message);
                supabase.auth.signOut();
                return;
            }
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'TOKEN_REFRESHED' && !session) {
                // Token refresh failed — clear bad credentials
                supabase.auth.signOut();
                return;
            }
            setSession(session);
            if (!session) setIsPackageOpen(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleShare = async () => {
        if (omenCardRef.current?.capture) {
            try {
                const uri = await omenCardRef.current.capture();
                if (uri) await shareAsync(uri);
            } catch (error) {
                console.error('Share failed', error);
            }
        }
    };

    return (
        <Animated.View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }, bgStyle]}>
            <StatusBar barStyle="light-content" />
            <Stack.Screen options={{ headerShown: false }} />




            {/* Header Buttons */}
            <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 }}>
                    <Pressable
                        onPress={() => setShowSettings(true)}
                        style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 999 }}
                    >
                        <Feather name="settings" size={20} color="rgba(255,255,255,0.7)" />
                    </Pressable>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {isPackageOpen && (
                            <Pressable
                                onPress={handleShare}
                                style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 999 }}
                            >
                                <Feather name="share" size={20} color="rgba(255,255,255,0.7)" />
                            </Pressable>
                        )}

                        {session?.user && (
                            <Pressable
                                onPress={() => setShowProfile(true)}
                                style={{ padding: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 999 }}
                            >
                                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
                                        {session.user.email?.[0].toUpperCase()}
                                    </Text>
                                </View>
                            </Pressable>
                        )}
                    </View>
                </View>
            </SafeAreaView>

            {/* Main Content */}
            <View style={{ width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -32 }}>
                <CardPackage
                    isOpen={isPackageOpen}
                    onOpen={() => setIsPackageOpen(true)}
                    language={language}
                >
                    <OmenCard ref={omenCardRef} language={language} />
                </CardPackage>
            </View>

            {/* Modals */}
            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                language={language}
                setLanguage={setLanguage}
            />
            <ProfileModal
                isOpen={showProfile}
                onClose={() => setShowProfile(false)}
                session={session}
            />
            <LoginModal
                isOpen={showLogin}
                onClose={() => setShowLogin(false)}
                onSuccess={() => setShowLogin(false)}
            />
        </Animated.View>
    );
}
