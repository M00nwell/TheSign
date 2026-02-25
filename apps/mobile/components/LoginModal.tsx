
import React, { useState } from 'react';
import { View, Text, Modal, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { supabase } from '../lib/supabase';
import { AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';

// Apple Sign-In doesn't work in Expo Go — the identity token aud is 'host.exp.Exponent'
// instead of the app bundle ID, which Supabase (correctly) rejects.
// Use email/password in Expo Go dev; Apple Sign-In works in real/dev builds.
const isExpoGo = Constants.appOwnership === 'expo';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Native Apple Sign-In — no browser popup, no redirect URLs needed
    const handleAppleSignIn = async () => {
        try {
            setLoading(true);
            setError(null);

            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            if (!credential.identityToken) throw new Error('No identity token from Apple');

            const { error: signInError } = await supabase.auth.signInWithIdToken({
                provider: 'apple',
                token: credential.identityToken,
            });

            if (signInError) throw signInError;
            onSuccess();
        } catch (e: any) {
            if (e.code === 'ERR_REQUEST_CANCELED') {
                // User dismissed Apple Sign-In — not an error
                return;
            }
            setError(e.message);
            Alert.alert('Auth Error', e.message);
        } finally {
            setLoading(false);
        }
    };

    // Google Sign-In via web OAuth flow
    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            setError(null);

            const redirectUrl = Linking.createURL('/auth/callback');
            const { data, error: signInError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
            });
            if (signInError) throw signInError;

            if (data?.url) {
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
                if (result.type === 'success' && result.url) {
                    const code = result.url.match(/[?&]code=([^&]+)/)?.[1];
                    const accessToken = result.url.match(/[#&]access_token=([^&]+)/)?.[1];
                    const refreshToken = result.url.match(/[#&]refresh_token=([^&]+)/)?.[1];
                    if (code) {
                        const { error: e } = await supabase.auth.exchangeCodeForSession(decodeURIComponent(code));
                        if (e) throw e;
                        onSuccess();
                    } else if (accessToken) {
                        const { error: e } = await supabase.auth.setSession({
                            access_token: decodeURIComponent(accessToken),
                            refresh_token: refreshToken ? decodeURIComponent(refreshToken) : '',
                        });
                        if (e) throw e;
                        onSuccess();
                    }
                }
            }
        } catch (e: any) {
            setError(e.message);
            Alert.alert('Auth Error', e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = async () => {
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onSuccess();
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                Alert.alert('Success', 'Check your email for the confirmation link!');
                // Automatically switch to login or just close? 
                // For now, let's just close or maybe keep them here to login.
                // Usually sign up behaves like login if auto-confirm is on, but often it requires email verification.
                // Let's assume we can proceed if session is created, otherwise alert.
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    onSuccess();
                } else {
                    setIsLogin(true); // Switch to login view
                }
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={isOpen}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="flex-1 justify-center items-center bg-black/80">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="w-full max-w-sm"
                    >
                        <View className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-gray-900 shadow-2xl">
                            {/* Background Effects */}
                            <LinearGradient
                                colors={['rgba(255,255,255,0.05)', 'transparent']}
                                className="absolute inset-0"
                            />

                            {/* Close Button */}
                            <Pressable
                                onPress={onClose}
                                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/5 active:bg-white/10"
                            >
                                <AntDesign name="close" size={20} color="#9ca3af" />
                            </Pressable>

                            <View className="p-8">
                                {/* Header */}
                                <View className="items-center mb-8">
                                    <Text className="text-4xl font-extrabold text-white tracking-tighter mb-2">
                                        The Sign
                                    </Text>
                                    <Text className="text-gray-400 text-base">
                                        {isLogin ? 'Welcome back' : 'Create your account'}
                                    </Text>
                                </View>

                                {/* Form */}
                                <View className="space-y-4">
                                    <View>
                                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Email</Text>
                                        <TextInput
                                            value={email}
                                            onChangeText={setEmail}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                            placeholder="you@example.com"
                                            placeholderTextColor="#6b7280"
                                            className="w-full h-12 px-4 bg-black/40 border border-white/10 rounded-xl text-white focus:border-indigo-500"
                                        />
                                    </View>

                                    <View>
                                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Password</Text>
                                        <TextInput
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry
                                            placeholder="••••••••"
                                            placeholderTextColor="#6b7280"
                                            className="w-full h-12 px-4 bg-black/40 border border-white/10 rounded-xl text-white focus:border-indigo-500"
                                        />
                                    </View>

                                    {error && (
                                        <View className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                            <Text className="text-red-400 text-xs">{error}</Text>
                                        </View>
                                    )}

                                    <Pressable
                                        onPress={handleAuth}
                                        disabled={loading}
                                        className={`w-full h-12 items-center justify-center rounded-xl bg-indigo-600 active:bg-indigo-700 active:scale-[0.98] ${loading ? 'opacity-70' : ''}`}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Text className="text-white font-bold text-base">
                                                {isLogin ? 'Sign In' : 'Sign Up'}
                                            </Text>
                                        )}
                                    </Pressable>
                                </View>

                                {/* Social Login */}
                                <View className="mt-6">
                                    <View className="flex-row items-center mb-4">
                                        <View className="flex-1 h-[1px] bg-white/10" />
                                        <Text className="mx-4 text-gray-500 text-xs uppercase tracking-wider">Or continue with</Text>
                                        <View className="flex-1 h-[1px] bg-white/10" />
                                    </View>

                                    <View className="flex-row space-x-4">
                                        <Pressable
                                            onPress={handleGoogleSignIn}
                                            className="flex-1 h-12 flex-row items-center justify-center bg-white/5 border border-white/10 rounded-xl active:bg-white/10"
                                        >
                                            <AntDesign name="google" size={20} color="white" />
                                            <Text className="text-white font-medium ml-2">Google</Text>
                                        </Pressable>
                                        {Platform.OS === 'ios' && (
                                            isExpoGo ? (
                                                <View className="flex-1 h-12 flex-row items-center justify-center border border-white/5 rounded-xl opacity-40">
                                                    <AntDesign name="apple" size={16} color="#6b7280" />
                                                    <Text className="text-gray-500 text-xs ml-2">Apple (dev build only)</Text>
                                                </View>
                                            ) : (
                                                <Pressable
                                                    onPress={handleAppleSignIn}
                                                    className="flex-1 h-12 flex-row items-center justify-center bg-white/5 border border-white/10 rounded-xl active:bg-white/10"
                                                >
                                                    <AntDesign name="apple" size={20} color="white" />
                                                    <Text className="text-white font-medium ml-2">Apple</Text>
                                                </Pressable>
                                            )
                                        )}
                                    </View>
                                </View>

                                {/* Footer Toggle */}
                                <View className="mt-8 pt-6 border-t border-white/10">
                                    <Pressable
                                        onPress={() => {
                                            setIsLogin(!isLogin);
                                            setError(null);
                                        }}
                                        className="flex-row justify-center items-center space-x-2"
                                    >
                                        <Text className="text-gray-400 text-sm">
                                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                                        </Text>
                                        <Text className="text-indigo-400 font-bold text-sm">
                                            {isLogin ? "Sign up" : "Sign in"}
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}
