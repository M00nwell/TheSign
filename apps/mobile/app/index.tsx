import { View, Text, TouchableOpacity, SafeAreaView, Pressable, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { supabase } from '../lib/supabase';
import OmenCard from '../components/OmenCard';
import CardPackage from '../components/CardPackage';
import { useState, useEffect } from 'react';
import { Feather, AntDesign } from '@expo/vector-icons';
import SettingsModal from '../components/SettingsModal';
import ProfileModal from '../components/ProfileModal';
import LoginModal from '../components/LoginModal';
import { Session } from '@supabase/supabase-js';

export default function Home() {
    const [language, setLanguage] = useState<'en' | 'zh'>('en');
    const [showSettings, setShowSettings] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [session, setSession] = useState<Session | null>(null);
    const [isPackageOpen, setIsPackageOpen] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) {
                // Return to landing page state (package closed)
                setIsPackageOpen(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleProfilePress = () => {
        if (session) {
            setShowProfile(true);
        }
    };

    return (
        <View className="flex-1 justify-center items-center bg-[#0a0a0a] relative">
            <StatusBar barStyle="light-content" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header Buttons - Absolute Positioned */}
            <SafeAreaView className="absolute top-0 left-0 w-full z-50 pointer-events-box-none">
                <View className="flex-row justify-between items-start px-6 py-4">
                    {/* Settings Button */}
                    <Pressable
                        onPress={() => setShowSettings(true)}
                        className="p-3 bg-white/5 border border-white/5 rounded-full backdrop-blur-md active:bg-white/10"
                    >
                        <Feather name="settings" size={20} color="rgba(255,255,255,0.7)" />
                    </Pressable>

                    {/* Profile Button - Only show if logged in */}
                    {session?.user && (
                        <Pressable
                            onPress={handleProfilePress}
                            className="p-1 pl-1 bg-white/5 border border-white/5 rounded-full backdrop-blur-md active:bg-white/10 flex-row items-center justify-center overflow-hidden"
                        >
                            <View className="w-9 h-9 rounded-full bg-indigo-600 items-center justify-center border border-white/10">
                                <Text className="text-white font-bold text-xs">
                                    {session.user.email?.[0].toUpperCase()}
                                </Text>
                            </View>
                        </Pressable>
                    )}
                </View>
            </SafeAreaView>

            {/* Main Content */}
            <View className="w-full flex-1 items-center justify-center -mt-8">
                <CardPackage
                    isOpen={isPackageOpen}
                    onOpen={() => setIsPackageOpen(true)}
                    language={language}
                >
                    <OmenCard language={language} />
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
        </View>
    );
}
