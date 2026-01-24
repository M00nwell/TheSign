
import { View, Text, Pressable, Image } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    Extrapolation
} from 'react-native-reanimated';
import { useState } from 'react';
import { AntDesign } from '@expo/vector-icons';

export default function OmenCard() {
    const spin = useSharedValue(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const handlePress = () => {
        setIsFlipped(!isFlipped);
        spin.value = withTiming(isFlipped ? 0 : 1, { duration: 600 });
    };

    const frontAnimatedStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(spin.value, [0, 1], [0, 180], Extrapolation.CLAMP);
        return {
            transform: [{ rotateY: `${rotateY}deg` }],
            opacity: interpolate(spin.value, [0, 0.5, 0.501, 1], [1, 1, 0, 0]),
            zIndex: interpolate(spin.value, [0, 0.5, 0.501, 1], [10, 10, 0, 0]),
        };
    });

    const backAnimatedStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(spin.value, [0, 1], [180, 360], Extrapolation.CLAMP);
        return {
            transform: [{ rotateY: `${rotateY}deg` }],
            opacity: interpolate(spin.value, [0, 0.5, 0.501, 1], [0, 0, 1, 1]),
            zIndex: interpolate(spin.value, [0, 0.5, 0.501, 1], [0, 0, 10, 10]),
        };
    });

    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    return (
        <Pressable onPress={handlePress} className="w-[340px] h-[520px]">
            <View className="relative w-full h-full">
                {/* FRONT FACE */}
                <Animated.View
                    className="absolute w-full h-full bg-gray-900 rounded-3xl border border-white/10 flex items-center justify-center p-8 overflow-hidden backface-hidden"
                    style={frontAnimatedStyle}
                >
                    {/* Decorative glow simulated with view */}
                    <View className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-white/5 rounded-full" />

                    <View className="z-10 flex flex-col items-center space-y-8">
                        <View className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <AntDesign name="calendar" size={40} color="#9ca3af" />
                        </View>

                        <View className="items-center">
                            <Text className="text-xl font-light tracking-widest text-gray-500 uppercase mb-2">{dayName}</Text>
                            <Text className="text-4xl font-bold text-white">{dateString}</Text>
                        </View>

                        <Text className="text-gray-600 text-sm font-light mt-8">Tap to reveal your sign</Text>
                    </View>
                </Animated.View>

                {/* BACK FACE */}
                <Animated.View
                    className="absolute w-full h-full bg-white rounded-3xl flex flex-col items-center justify-between p-8 overflow-hidden backface-hidden"
                    style={backAnimatedStyle}
                >
                    <View className="w-full flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-gray-100 p-6 mb-6">
                        <Image
                            source={require('../assets/sign.png')}
                            className="w-full h-[220px]"
                            resizeMode="contain"
                        />
                    </View>

                    <View className="items-center">
                        <Text className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Daily Omen</Text>
                        <Text className="text-xl text-center text-gray-800 italic" style={{ fontFamily: 'System' }}>
                            "Caution is the parent of safety. Avoid rushing decisions today."
                        </Text>
                    </View>

                    <View className="w-full mt-6 flex flex-row justify-center">
                        <View className="h-1 w-12 bg-gray-200 rounded-full" />
                    </View>
                </Animated.View>
            </View>
        </Pressable>
    );
}
