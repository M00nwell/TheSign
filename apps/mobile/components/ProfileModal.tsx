
import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ActivityIndicator, Alert } from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: Session | null;
}

export default function ProfileModal({ isOpen, onClose, session }: ProfileModalProps) {
    const [signingOut, setSigningOut] = useState(false);

    const handleSignOut = async () => {
        try {
            setSigningOut(true);
            const { error } = await supabase.auth.signOut();
            // Force removal from storage just in case
            await AsyncStorage.removeItem('sb-evlusrnimwwdrkwiraoe-auth-token');
            if (error) throw error;
            onClose();
        } catch (error: any) {
            Alert.alert('Error signing out', error.message);
        } finally {
            setSigningOut(false);
        }
    };

    if (!session) return null;

    const email = session.user.email;
    const initial = email ? email[0].toUpperCase() : '?';
    const year = new Date(session.user.created_at).getFullYear();

    return (
        <Modal
            visible={isOpen}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center bg-black/80">
                {/* Backdrop Click Handler */}
                <Pressable
                    className="absolute inset-0"
                    onPress={onClose}
                />

                <View className="relative w-[340px] overflow-hidden rounded-3xl border border-white/10 bg-[#121212] shadow-2xl p-6">
                    <LinearGradient
                        colors={['rgba(255,255,255,0.05)', 'transparent']}
                        className="absolute inset-0"
                    />

                    <View className="items-center space-y-4">
                        {/* Avatar */}
                        <View className="w-20 h-20 rounded-full bg-indigo-600 items-center justify-center border-4 border-white/10 shadow-lg mb-4">
                            <Text className="text-3xl font-bold text-white">{initial}</Text>
                        </View>

                        {/* Info */}
                        <View className="items-center mb-6">
                            <Text className="text-white font-medium text-lg mb-1" numberOfLines={1}>{email}</Text>
                            <Text className="text-gray-400 text-sm">Member since {year}</Text>
                        </View>

                        <View className="w-full h-[1px] bg-white/10 mb-6" />

                        {/* Logout */}
                        <Pressable
                            onPress={handleSignOut}
                            disabled={signingOut}
                            className="w-full flex-row items-center justify-center px-4 py-3 rounded-xl bg-white/5 border border-white/5 active:bg-red-500/20 active:border-red-500/30"
                        >
                            {signingOut ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <Feather name="log-out" size={18} color="#e5e7eb" />
                                    <Text className="text-gray-200 font-medium ml-2">Sign Out</Text>
                                </>
                            )}
                        </Pressable>
                    </View>

                    {/* Close */}
                    <Pressable
                        onPress={onClose}
                        className="absolute top-4 right-4 p-2"
                    >
                        <AntDesign name="close" size={20} color="#6b7280" />
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}
