import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withSequence,
    withTiming,
    runOnJS,
    interpolate,
    Extrapolation
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';
import LoginModal from './LoginModal';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CardPackageProps {
    children: React.ReactNode;
    isOpen: boolean;
    onOpen: () => void;
    language: 'en' | 'zh';
}

export default function CardPackage({ children, isOpen, onOpen, language }: CardPackageProps) {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Animated values
    const translateX = useSharedValue(0);
    const arrowOffset = useSharedValue(0);
    const context = useSharedValue({ x: 0 });
    const isAuthShared = useSharedValue(false);

    // Check storage on mount to see if user has already opened today's omen
    React.useEffect(() => {
        const checkStatus = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const userId = session?.user?.id ?? 'anon';
                const todayKey = new Date().toISOString().split('T')[0];
                const storageKey = `daily-omen-v4-${todayKey}-${userId}`;

                const cached = await AsyncStorage.getItem(storageKey);

                // If we found today's omen, auto-open to skip the package
                if (cached) {
                    onOpen();
                }
                // Otherwise, stay closed (default)
            } catch (e) {
                console.error(e);
            }
        };
        checkStatus();
    }, []);

    React.useEffect(() => {
        arrowOffset.value = withRepeat(
            withSequence(
                withTiming(-5, { duration: 1000 }),
                withTiming(0, { duration: 1000 })
            ),
            -1, // Infinite
            true // Reverse
        );
    }, []);

    React.useEffect(() => {
        if (!isOpen) {
            translateX.value = withSpring(0);
        }
    }, [isOpen]);

    React.useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsAuthenticated(!!session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session);
        });

        return () => subscription.unsubscribe();
    }, []);

    React.useEffect(() => {
        isAuthShared.value = isAuthenticated;
    }, [isAuthenticated]);

    const leftArrowStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: arrowOffset.value }]
    }));

    const rightArrowStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: -arrowOffset.value }]
    }));

    const handleLoginSuccess = () => {
        setShowLoginModal(false);
        onOpen();
    };

    const handleOpenAttempt = () => {
        if (isAuthenticated) {
            onOpen();
        } else {
            setShowLoginModal(true);
        }
    };

    const pan = Gesture.Pan()
        .onStart(() => {
            context.value = { x: translateX.value };
        })
        .onUpdate((event) => {
            translateX.value = event.translationX * 0.8;
        })
        .onEnd((event) => {
            if (Math.abs(event.translationX) > 100) {
                if (isAuthShared.value) {
                    runOnJS(handleOpenAttempt)();
                    // Fly off screen
                    translateX.value = withSpring(Math.sign(event.translationX) * 1000);
                } else {
                    runOnJS(handleOpenAttempt)();
                    // Spring back so they can try again (and see modal)
                    translateX.value = withSpring(0);
                }
            } else {
                translateX.value = withSpring(0);
            }
        });

    const packageStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            Math.abs(translateX.value),
            [0, 200],
            [1, 0],
            Extrapolation.CLAMP
        );
        const scale = interpolate(
            Math.abs(translateX.value),
            [0, 200],
            [1, 0.9],
            Extrapolation.CLAMP
        );
        const rotate = interpolate(
            translateX.value,
            [-200, 200],
            [-10, 10],
            Extrapolation.CLAMP
        );

        return {
            transform: [
                { translateX: translateX.value },
                { scale },
                { perspective: 1000 },
                { rotate: `${rotate}deg` }
            ],
            opacity
        };
    });

    const today = new Date();
    const dateString = language === 'zh'
        ? `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
        : today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    if (isOpen) {
        return (
            <Animated.View style={{ opacity: 1, transform: [{ scale: 1 }], flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                {children}
            </Animated.View>
        );
    }

    return (
        <View style={{ width: 340, height: 520, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onSuccess={handleLoginSuccess}
            />

            {/* The Content (Hidden Behind) */}
            <View style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 0 }}>
                {/* Children kept mounted but covered */}
            </View>

            {/* The Package */}
            <GestureDetector gesture={pan}>
                <Animated.View style={[styles.packageContainer, packageStyle]}>
                    {/* --- TOP STRIP (The part that tears) --- */}
                    <View className="absolute top-0 left-0 right-0 h-[85px] z-30 overflow-hidden">
                        <LinearGradient
                            colors={['#1a1f2e', '#111827', '#0a0d14']}
                            style={StyleSheet.absoluteFill}
                        />
                        {/* Crimp Pattern (Top) */}
                        <View className="absolute top-0 left-0 right-0 h-1 bg-black opacity-20" style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.5)', borderStyle: 'dotted' }} />

                        {/* Tear Indicator Area */}
                        <View style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingTop: 8,
                            paddingHorizontal: 4
                        }}>
                            <Text className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1 shadow-black shadow-sm">
                                {language === 'zh' ? '向两侧撕开' : 'Tear Open'}
                            </Text>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                                paddingHorizontal: 16
                            }}>
                                <Animated.Text style={[styles.arrowText, leftArrowStyle]}>←</Animated.Text>
                                {/* Dashed Line */}
                                <View style={{
                                    flex: 1,
                                    height: 1,
                                    borderTopWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.2)',
                                    borderStyle: 'dashed',
                                    marginHorizontal: 12
                                }} />
                                <Animated.Text style={[styles.arrowText, rightArrowStyle]}>→</Animated.Text>
                            </View>
                        </View>

                        {/* Bottom Tear Edge Shadow */}
                        <View className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/50 shadow-sm" />
                    </View>

                    {/* --- MAIN BODY --- */}
                    <View className="absolute top-[85px] left-0 right-0 bottom-0 z-20">
                        <LinearGradient
                            colors={['#141828', '#0d1117', '#060a10']}
                            style={StyleSheet.absoluteFill}
                        />

                        {/* Jagged Top Edge Simulation */}
                        <View className="absolute -top-[1px] left-0 right-0 h-[2px] bg-black/80" />

                        <View className="flex-1 items-center justify-center p-8 space-y-8">
                            {/* Logo / Icon */}
                            <View className="w-16 h-16 rounded-full bg-white/5 border border-white/10 items-center justify-center shadow-sm">
                                <Text style={{ fontSize: 24 }}>🔮</Text>
                            </View>

                            {/* Date Display */}
                            <View className="items-center space-y-4">
                                <Text className="text-gray-400 font-serif tracking-widest text-xs uppercase mb-1">
                                    {language === 'zh' ? '今日运势' : 'Daily Omen'}
                                </Text>
                                <Text className="text-3xl font-bold text-white text-center shadow-sm">
                                    {dateString}
                                </Text>
                                <View className="w-20 h-[1px] bg-white/10 my-4" />
                                <View className="border border-white/10 px-3 py-1 rounded-full">
                                    <Text className="text-white/30 text-[10px] tracking-widest font-light uppercase">
                                        {language === 'zh' ? '每日限定' : 'LIMITED EDITION'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Bottom Crimp */}
                        <View className="absolute bottom-0 left-0 right-0 h-3 bg-black opacity-30" style={{ borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.5)', borderStyle: 'dotted' }} />
                    </View>
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    packageContainer: {
        width: '100%',
        height: '100%',
        zIndex: 20,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    arrowText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 18,
        fontWeight: '300',
    },
    gradientBackground: {
        flex: 1,
        width: '100%',
        height: '100%',
    }
});
