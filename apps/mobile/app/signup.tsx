import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Stack, Link } from 'expo-router';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signUpWithEmail() {
        setLoading(true);
        const {
            data: { session },
            error,
        } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            Alert.alert('Error', error.message);
        } else if (!session) {
            Alert.alert('Success', 'Please check your inbox for email verification!');
        }
        setLoading(false);
    }

    return (
        <View className="flex-1 justify-center px-8 bg-[#0a0a0a]">
            <Stack.Screen options={{ headerShown: false }} />

            <View className="mb-8 items-center">
                <Text className="text-5xl font-extrabold text-white mb-2">The Sign</Text>
                <Text className="text-gray-400 text-lg">Create your account</Text>
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
                    onPress={signUpWithEmail}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Sign Up</Text>
                    )}
                </TouchableOpacity>

                <View className="flex-row justify-center mt-4">
                    <Text className="text-gray-500">Already have an account? </Text>
                    <Link href="/login" asChild>
                        <TouchableOpacity>
                            <Text className="text-indigo-400 font-bold">Login</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </View>
    );
}
