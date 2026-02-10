
import React from 'react';
import { View, Text, Modal, Pressable, TouchableWithoutFeedback } from 'react-native';
import { AntDesign, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    language: 'en' | 'zh';
    setLanguage: (lang: 'en' | 'zh') => void;
}

export default function SettingsModal({ isOpen, onClose, language, setLanguage }: SettingsModalProps) {
    return (
        <Modal
            visible={isOpen}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View className="flex-1 justify-center items-center bg-black/80">
                    <TouchableWithoutFeedback>
                        <View className="relative w-[340px] overflow-hidden rounded-3xl border border-white/10 bg-[#121212] shadow-2xl">
                            <LinearGradient
                                colors={['rgba(255,255,255,0.05)', 'transparent']}
                                className="absolute inset-0"
                            />

                            {/* Header */}
                            <View className="flex-row items-center justify-between p-4 border-b border-white/10 bg-white/5">
                                <View className="flex-row items-center space-x-2">
                                    <Feather name="settings" size={18} color="white" />
                                    <Text className="text-white font-medium ml-2">Settings</Text>
                                </View>
                                <Pressable onPress={onClose} className="p-1">
                                    <AntDesign name="close" size={20} color="#9ca3af" />
                                </Pressable>
                            </View>

                            <View className="p-6 space-y-6">
                                {/* Language Setting */}
                                <View>
                                    <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex-row items-center">
                                        <Feather name="globe" size={14} color="#9ca3af" />
                                        <Text className="ml-2">Language / 语言</Text>
                                    </Text>

                                    <View className="flex-row bg-black/40 rounded-lg border border-white/5 p-1">
                                        <Pressable
                                            onPress={() => setLanguage('en')}
                                            className={`flex-1 py-2 items-center rounded-md ${language === 'en' ? 'bg-indigo-600' : 'active:bg-white/5'}`}
                                        >
                                            <Text className={`text-sm font-medium ${language === 'en' ? 'text-white' : 'text-gray-400'}`}>English</Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => setLanguage('zh')}
                                            className={`flex-1 py-2 items-center rounded-md ${language === 'zh' ? 'bg-indigo-600' : 'active:bg-white/5'}`}
                                        >
                                            <Text className={`text-sm font-medium ${language === 'zh' ? 'text-white' : 'text-gray-400'}`}>中文</Text>
                                        </Pressable>
                                    </View>
                                </View>

                                {/* Theme Stub */}
                                <View className="opacity-50">
                                    <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex-row items-center">
                                        <Feather name="layout" size={14} color="#6b7280" />
                                        <Text className="ml-2">Theme (Coming Soon)</Text>
                                    </Text>
                                    <View className="flex-row space-x-2 gap-2">
                                        <View className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-white/20" />
                                        <View className="w-8 h-8 rounded-full bg-emerald-600" />
                                        <View className="w-8 h-8 rounded-full bg-rose-600" />
                                    </View>
                                </View>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}
