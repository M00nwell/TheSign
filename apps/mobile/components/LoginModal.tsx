
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

const I18N = {
    en: {
        title: 'The Sign',
        welcomeBack: 'Welcome back',
        createAccount: 'Create your account',
        emailLabel: 'Email',
        emailPlaceholder: 'you@example.com',
        passwordLabel: 'Password',
        passwordPlaceholder: '••••••••',
        signIn: 'Sign In',
        signUp: 'Sign Up',
        orContinueWith: 'Or continue with',
        google: 'Google',
        apple: 'Apple',
        appleDevOnly: 'Apple (dev build only)',
        signUpSuccess: 'Check your email for the confirmation link!',
        emptyFields: 'Please enter both email and password.',
        noAccount: "Don't have an account?",
        haveAccount: 'Already have an account?',
        signUpLink: 'Sign up',
        signInLink: 'Sign in',
    },
    zh: {
        title: 'The Sign',
        welcomeBack: '欢迎回来',
        createAccount: '创建您的账户',
        emailLabel: '邮箱',
        emailPlaceholder: 'you@example.com',
        passwordLabel: '密码',
        passwordPlaceholder: '••••••••',
        signIn: '登录',
        signUp: '注册',
        orContinueWith: '或使用以下方式继续',
        google: 'Google',
        apple: 'Apple',
        appleDevOnly: 'Apple（仅限开发版）',
        signUpSuccess: '请查收邮件中的确认链接！',
        emptyFields: '请输入邮箱和密码。',
        noAccount: '还没有账户？',
        haveAccount: '已有账户？',
        signUpLink: '立即注册',
        signInLink: '立即登录',
    },
}

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    language: 'en' | 'zh';
    setLanguage: (lang: 'en' | 'zh') => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess, language, setLanguage }: LoginModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const t = I18N[language] ?? I18N.en;

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

            // Use the explicit app scheme so Android/iOS correctly routes the
            // callback back to this app. Linking.createURL can produce an
            // exp+... prefix in some Expo build contexts which breaks the redirect.
            const redirectUrl = 'the-sign://auth/callback';
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
            setError(t.emptyFields);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                onSuccess();
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                Alert.alert('Success', t.signUpSuccess);
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    onSuccess();
                } else {
                    setIsLogin(true);
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

                            {/* Language Toggle — top left */}
                            <View style={{
                                position: 'absolute', top: 16, left: 16, zIndex: 50,
                                flexDirection: 'row', alignItems: 'center',
                                backgroundColor: 'rgba(0,0,0,0.3)',
                                borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                                borderRadius: 999, padding: 4,
                            }}>
                                <Pressable
                                    onPress={() => setLanguage('en')}
                                    style={{
                                        paddingHorizontal: 12, paddingVertical: 4,
                                        borderRadius: 999,
                                        backgroundColor: language === 'en' ? '#4f46e5' : 'transparent',
                                    }}
                                >
                                    <Text style={{
                                        fontSize: 12, fontWeight: '700',
                                        color: language === 'en' ? 'white' : '#9ca3af',
                                    }}>EN</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => setLanguage('zh')}
                                    style={{
                                        paddingHorizontal: 12, paddingVertical: 4,
                                        borderRadius: 999,
                                        backgroundColor: language === 'zh' ? '#4f46e5' : 'transparent',
                                    }}
                                >
                                    <Text style={{
                                        fontSize: 12, fontWeight: '700',
                                        color: language === 'zh' ? 'white' : '#9ca3af',
                                    }}>中文</Text>
                                </Pressable>
                            </View>

                            {/* Close Button */}
                            <Pressable
                                onPress={onClose}
                                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/5 active:bg-white/10"
                            >
                                <AntDesign name="close" size={20} color="#9ca3af" />
                            </Pressable>

                            <View className="p-8 pt-16">
                                {/* Header */}
                                <View className="items-center mb-8">
                                    <Text className="text-4xl font-extrabold text-white tracking-tighter mb-2">
                                        {t.title}
                                    </Text>
                                    <Text className="text-gray-400 text-base">
                                        {isLogin ? t.welcomeBack : t.createAccount}
                                    </Text>
                                </View>

                                {/* Form */}
                                <View className="space-y-4">
                                    <View>
                                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">{t.emailLabel}</Text>
                                        <TextInput
                                            value={email}
                                            onChangeText={setEmail}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                            placeholder={t.emailPlaceholder}
                                            placeholderTextColor="#6b7280"
                                            className="w-full h-12 px-4 bg-black/40 border border-white/10 rounded-xl text-white focus:border-indigo-500"
                                        />
                                    </View>

                                    <View>
                                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">{t.passwordLabel}</Text>
                                        <TextInput
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry
                                            placeholder={t.passwordPlaceholder}
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
                                                {isLogin ? t.signIn : t.signUp}
                                            </Text>
                                        )}
                                    </Pressable>
                                </View>

                                {/* Social Login */}
                                <View className="mt-6">
                                    <View className="flex-row items-center mb-4">
                                        <View className="flex-1 h-[1px] bg-white/10" />
                                        <Text className="mx-4 text-gray-500 text-xs uppercase tracking-wider">{t.orContinueWith}</Text>
                                        <View className="flex-1 h-[1px] bg-white/10" />
                                    </View>

                                    <View className="flex-row space-x-4">
                                        <Pressable
                                            onPress={handleGoogleSignIn}
                                            className="flex-1 h-12 flex-row items-center justify-center bg-white/5 border border-white/10 rounded-xl active:bg-white/10"
                                        >
                                            <AntDesign name="google" size={20} color="white" />
                                            <Text className="text-white font-medium ml-2">{t.google}</Text>
                                        </Pressable>
                                        {Platform.OS === 'ios' && (
                                            isExpoGo ? (
                                                <View className="flex-1 h-12 flex-row items-center justify-center border border-white/5 rounded-xl opacity-40">
                                                    <AntDesign name="apple" size={16} color="#6b7280" />
                                                    <Text className="text-gray-500 text-xs ml-2">{t.appleDevOnly}</Text>
                                                </View>
                                            ) : (
                                                <Pressable
                                                    onPress={handleAppleSignIn}
                                                    className="flex-1 h-12 flex-row items-center justify-center bg-white/5 border border-white/10 rounded-xl active:bg-white/10"
                                                >
                                                    <AntDesign name="apple" size={20} color="white" />
                                                    <Text className="text-white font-medium ml-2">{t.apple}</Text>
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
                                            {isLogin ? t.noAccount : t.haveAccount}
                                        </Text>
                                        <Text className="text-indigo-400 font-bold text-sm">
                                            {isLogin ? t.signUpLink : t.signInLink}
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
