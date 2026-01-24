import { View, Text, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { supabase } from '../lib/supabase';
import OmenCard from '../components/OmenCard';

export default function Home() {
    return (
        <View className="flex-1 justify-center items-center bg-[#0a0a0a] px-6">
            <Stack.Screen options={{ headerShown: false }} />

            <OmenCard />
        </View>
    );
}
