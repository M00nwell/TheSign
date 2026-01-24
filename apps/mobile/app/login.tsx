import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Stack, Link } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AUTH_PROVIDERS, AuthProvider } from '@repo/api';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { AntDesign } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) Alert.alert('Error', error.message);
        setLoading(false);
    }

    async function signInWithOAuth(provider: AuthProvider) {
        setLoading(true);
        try {
            const redirectTo = makeRedirectUri({
                scheme: 'the-sign',
                path: 'auth/callback',
            });

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo,
                    skipBrowserRedirect: true,
                },
            });

            if (error) throw error;
            if (!data?.url) throw new Error('No auth URL returned');

            const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

            if (result.type === 'success') {
                const { url } = result;
                // Parse the URL to get the access_token/refresh_token or code
                // Supabase typically sends tokens in the hash for implicit flow: #access_token=...
                // Or code in search params for PKCE.
                // We'll trust supabase session handling usually? 
                // Actually, if detectSessionInUrl is false, we must parse manually.

                // For simplicity, we can rely on supabase.auth.getSession() if we passed the code exchange URL?
                // No, we need to extract the tokens/code.

                // Let's assume URL contains the params. 
                // A robust way is to parse the URL segments.
                if (url) {
                    // This sets the session using the URL which contains access_token and refresh_token
                    // But Supabase JS works best if we parse it.
                    // However, starting a session from URL is what we want.
                    // If we use implicit flow (default usually for mobile redirect?), it has #access_token
                    // If we use PKCE, it has ?code=

                    // Simple hack: Let Supabase handle the URL if we can pass it?
                    // supabase.auth.setSession(url) doesn't exist.
                    // createSessionFromUrl(url) logic:

                    const params = extractParamsFromUrl(url);
                    if (params.access_token && params.refresh_token) {
                        await supabase.auth.setSession({
                            access_token: params.access_token,
                            refresh_token: params.refresh_token,
                        });
                    } else if (params.code) {
                        // Exchange code
                        await supabase.auth.exchangeCodeForSession(params.code);
                    }
                }
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <View className="flex-1 justify-center px-8 bg-[#0a0a0a]">
            <Stack.Screen options={{ headerShown: false }} />

            <View className="mb-8 items-center">
                <Text className="text-5xl font-extrabold text-white mb-2">The Sign</Text>
                <Text className="text-gray-400 text-lg">Welcome back</Text>
            </View>

            <View className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <View className="space-y-2">
                    <Text className="text-gray-300 font-medium ml-1">Email</Text>
                    <TextInput
                        className="bg-black/40 border border-white/10 text-white rounded-xl p-4 text-base"
                        placeholder="you@example.com"
                        placeholderTextColor="#666"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View className="space-y-2">
                    <Text className="text-gray-300 font-medium ml-1">Password</Text>
                    <TextInput
                        className="bg-black/40 border border-white/10 text-white rounded-xl p-4 text-base"
                        placeholder="••••••••"
                        placeholderTextColor="#666"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                </View>

                <TouchableOpacity
                    className={`bg-indigo-600 p-4 rounded-xl items-center mt-6 ${loading ? 'opacity-70' : ''}`}
                    onPress={signInWithEmail}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Sign In</Text>
                    )}
                </TouchableOpacity>

                <View className="flex-row items-center my-4">
                    <View className="flex-1 h-[1px] bg-white/10" />
                    <Text className="mx-4 text-gray-500">Or continue with</Text>
                    <View className="flex-1 h-[1px] bg-white/10" />
                </View>

                <View className="space-y-3">
                    {AUTH_PROVIDERS.map((provider) => {
                        const iconName = provider.name === 'google' ? 'google' : 'apple1';
                        return (
                            <TouchableOpacity
                                key={provider.name}
                                className="bg-white/5 border border-white/10 p-4 rounded-xl flex-row items-center justify-center space-x-3 active:bg-white/10"
                                onPress={() => signInWithOAuth(provider.name)}
                                disabled={loading}
                            >
                                <AntDesign name={iconName} size={24} color="white" style={{ marginRight: 10 }} />
                                <Text className="text-white font-medium text-base">{provider.label}</Text>
                            </TouchableOpacity>
                        )
                    })}
                </View>

                <View className="flex-row justify-center mt-4">
                    <Text className="text-gray-500">Don't have an account? </Text>
                    <Link href="/signup" asChild>
                        <TouchableOpacity>
                            <Text className="text-indigo-400 font-bold">Sign Up</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </View>
    );
}

function extractParamsFromUrl(url: string) {
    const params: Record<string, string> = {};

    // Handle both query (?) and fragment (#)
    const queryString = url.split('?')[1];
    const fragmentString = url.split('#')[1];

    if (queryString) {
        queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            params[key] = decodeURIComponent(value);
        });
    }

    if (fragmentString) {
        fragmentString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            params[key] = decodeURIComponent(value);
        });
    }

    return params;
}
