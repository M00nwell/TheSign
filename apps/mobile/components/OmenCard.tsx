import { View, Text, Pressable, Image, ActivityIndicator, ImageBackground } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolate,
    Extrapolation,
    runOnJS,
    withTiming
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

// Matches the structure from web app content
interface OmenContent {
    text: string;
    explanation: string;
    activityDisplayName: string;
}

interface OmenData {
    content: {
        en: OmenContent;
        zh: OmenContent;
    };
    imageUrl: string | null;
    activityName: string;
    type: 'suit' | 'avoid';
    almanac: {
        gzYear: string;
        lunarMonth: number;
        lunarDay: number;
    };
}

const toChineseLunarMonth = (m: number) => {
    const months = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
    return months[m - 1] || m.toString();
}

const toChineseLunarDay = (d: number) => {
    if (d === 20) return '二十';
    if (d === 30) return '三十';
    const prefix = d < 11 ? '初' : (d < 20 ? '十' : '廿');
    const digits = ['十', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const lastDigit = d % 10;

    if (d < 11) return prefix + digits[lastDigit];

    const chineseDays = [
        '', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
        '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
        '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
    ];
    return chineseDays[d] || d.toString();
}

const API_URL = 'http://192.168.0.17:3000/api/daily-omen'; // Ensure this matches your local IP

// Module-level deduplication
let activeFetchPromise: Promise<OmenData | null> | null = null;

interface OmenCardProps {
    language: 'en' | 'zh';
}


export default function OmenCard({ language }: OmenCardProps) {
    const [omen, setOmen] = useState<OmenData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFlippedState, setIsFlippedState] = useState(false);

    // Reanimated Shared Values
    const rotateY = useSharedValue(0);
    const startRotateY = useSharedValue(0);

    const pan = Gesture.Pan()
        .onStart(() => {
            startRotateY.value = rotateY.value;
        })
        .onUpdate((event) => {
            // Dragging adjusts rotation. Sensitivity factor included.
            rotateY.value = startRotateY.value + event.translationX * 0.4;
        })
        .onEnd((event) => {
            const current = rotateY.value;
            let target = current;

            // Thresholds for flipping
            const isSlideRight = event.translationX > 60 || event.velocityX > 500;
            const isSlideLeft = event.translationX < -60 || event.velocityX < -500;

            // Snap to nearest 180 degree increment to prevent sticking
            // Always land on a multiple of 180 (0, 180, 360, etc.)

            if (isSlideRight) {
                // Drag Right -> Go to next 180 increment (Right/Clockwise visually if positive sens)
                target = (Math.floor(current / 180) + 1) * 180;
            } else if (isSlideLeft) {
                // Drag Left -> Go to prev 180 increment (Left visually if positive sens)
                target = (Math.ceil(current / 180) - 1) * 180;
            } else {
                // Revert to nearest 180
                target = Math.round(current / 180) * 180;
            }

            rotateY.value = withSpring(target, { overshootClamping: false });

            // Determine if the *target* state is Back or Front
            const normalized = Math.abs(target % 360);
            const isBack = Math.abs(normalized - 180) < 5;
            runOnJS(setIsFlippedState)(isBack);
        });

    useEffect(() => {
        fetchOmen();
    }, []);

    const fetchOmen = async () => {
        try {
            setLoading(true);

            const todayKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const storageKey = `daily-omen-v4-${todayKey}`;

            const cached = await AsyncStorage.getItem(storageKey);

            if (cached) {
                setOmen(JSON.parse(cached));
                setLoading(false);
                return;
            }

            if (!activeFetchPromise) {
                activeFetchPromise = fetch(API_URL)
                    .then(res => res.json())
                    .then(data => data as OmenData)
                    .catch(err => {
                        console.error("Fetch error:", err);
                        return null;
                    })
                    .finally(() => {
                        activeFetchPromise = null;
                    });
            }

            const data = await activeFetchPromise;

            if (data) {
                await AsyncStorage.setItem(storageKey, JSON.stringify(data));
                setOmen(data);
            }
        } catch (error) {
            console.error('Failed to fetch omen:', error);
        } finally {
            setLoading(false);
        }
    };

    // Keep handleFlip for tapping if needed, or remove? 
    // Usually good to keep tap accessible or just use drag?
    // User asked for "drag to turn", but usually tap is also supported or expected.
    // Let's keep tap logic but using reanimated.
    const handleFlip = () => {
        if (!loading) {
            const current = rotateY.value;
            // Basic toggle 0 <-> 180
            // Check if closest to 0 or 180
            const isFront = Math.abs(current - 0) < Math.abs(current - 180);
            const target = isFront ? 180 : 0;

            rotateY.value = withSpring(target);
            setIsFlippedState(target === 180);
        }
    };

    const handleDevReload = async () => {
        setLoading(true);
        const todayKey = new Date().toISOString().split('T')[0];
        const storageKey = `daily-omen-v4-${todayKey}`;
        await AsyncStorage.removeItem(storageKey);

        // Reset rotation
        rotateY.value = withSpring(0);
        runOnJS(setIsFlippedState)(false);

        // Fetch new
        fetchOmen();
    };


    const frontAnimatedStyle = useAnimatedStyle(() => {
        const val = rotateY.value;
        const normalized = ((val % 360) + 360) % 360;
        const isVisible = normalized < 90 || normalized > 270;

        return {
            transform: [
                { perspective: 1000 },
                { rotateY: `${val}deg` } // Front at Z=0
            ],
            zIndex: isVisible ? 10 : 1, // Front occludes layers if visible
        };
    });

    const backStyleFinal = useAnimatedStyle(() => {
        const val = rotateY.value;
        const normalized = ((val % 360) + 360) % 360;
        const isVisible = normalized > 90 && normalized < 270;

        return {
            transform: [
                { perspective: 1000 },
                { rotateY: `${val + 180}deg` }
            ],
            // Ensure Back is covers layers when visible
            zIndex: isVisible ? 10 : 1,
        };
    });




    return (
        <View className="relative w-[340px] h-[520px]">
            <GestureDetector gesture={pan}>
                <Pressable className="w-full h-full">
                    <View className="relative w-full h-full">


                        {/* FRONT FACE: RESULT */}
                        <Animated.View
                            className="absolute w-full h-full bg-white rounded-3xl border border-gray-200 flex flex-col items-center justify-between p-6 overflow-hidden backface-hidden shadow-sm"
                            style={[frontAnimatedStyle, { backfaceVisibility: 'hidden' }]}
                        >
                            {/* DEV RELOAD BUTTON */}
                            {__DEV__ && (
                                <Pressable
                                    onPress={handleDevReload}
                                    className="absolute top-4 left-4 z-50 bg-gray-100 px-2 py-1 rounded opacity-50"
                                >
                                    <Text className="text-[10px] text-gray-500">Dev Reload</Text>
                                </Pressable>
                            )}

                            {loading ? (
                                <View className="flex-1 items-center justify-center space-y-4">
                                    <ActivityIndicator size="large" color="#4f46e5" />
                                    <Text className="text-gray-400 text-sm font-medium">Consulting the oracles...</Text>
                                </View>
                            ) : omen ? (
                                <>
                                    {/* Top right badge removed */}

                                    <View className="w-full h-[60%] relative flex items-center justify-center mt-6 z-10">
                                        {omen.imageUrl ? (
                                            <>
                                                {/* Shadow Layer */}
                                                <Image
                                                    source={{ uri: omen.imageUrl }}
                                                    className="absolute w-full h-full"
                                                    resizeMode="contain"
                                                    style={{
                                                        tintColor: 'black',
                                                        opacity: 0.2,
                                                        transform: [{ translateY: 12 }, { scale: 0.95 }]
                                                    }}
                                                    blurRadius={4}
                                                />
                                                {/* Main Image */}
                                                <Image
                                                    source={{ uri: omen.imageUrl }}
                                                    className="w-full h-full"
                                                    resizeMode="contain"
                                                />
                                            </>
                                        ) : (
                                            <>
                                                {/* Shadow Layer */}
                                                <Image
                                                    source={require('../assets/sign.png')}
                                                    className="absolute w-full h-full"
                                                    resizeMode="contain"
                                                    style={{
                                                        tintColor: 'black',
                                                        opacity: 0.2,
                                                        transform: [{ translateY: 12 }, { scale: 0.95 }]
                                                    }}
                                                    blurRadius={4}
                                                />
                                                {/* Main Image */}
                                                <Image
                                                    source={require('../assets/sign.png')}
                                                    className="w-full h-full"
                                                    resizeMode="contain"
                                                />
                                            </>
                                        )}
                                    </View>

                                    <View className="w-full flex-1 items-center justify-center -mt-4">
                                        <Text className="text-2xl font-serif italic text-gray-600 leading-tight px-2 text-center">{omen.content[language].text}</Text>
                                    </View>

                                    <Text className="mt-4 text-xs text-gray-400 font-medium tracking-wide uppercase">
                                        {language === 'en' ? 'Swipe to Interpret' : '滑动查看解读'}
                                    </Text>
                                </>
                            ) : (
                                <View className="flex-1 items-center justify-center">
                                    <Text className="text-gray-500">No omen found for today.</Text>
                                </View>
                            )}
                        </Animated.View>

                        {/* BACK FACE: EXPLANATION */}
                        <Animated.View
                            className="absolute w-full h-full bg-slate-50 rounded-3xl border border-indigo-100 flex flex-col items-center p-8 pt-16 overflow-hidden backface-hidden shadow-sm"
                            style={[backStyleFinal, { backfaceVisibility: 'hidden' }]}
                        >
                            {omen && (
                                <>

                                    {omen.almanac && (
                                        <View
                                            className="w-[80%] mb-6 rounded-sm bg-[#f4e4bc] p-4 items-center justify-center border border-[#e6d2a0]"
                                            style={{
                                                shadowColor: "#8b5a2b",
                                                shadowOffset: { width: 0, height: 8 },
                                                shadowOpacity: 0.5,
                                                shadowRadius: 8,
                                                elevation: 12
                                            }}
                                        >
                                            <Text className="text-sm font-medium opacity-80 mb-1 font-serif text-gray-800">
                                                {omen.almanac.gzYear}年
                                            </Text>
                                            <Text className="text-lg font-bold mb-2 text-[#8b5a2b]">
                                                {toChineseLunarMonth(omen.almanac.lunarMonth)}月{toChineseLunarDay(omen.almanac.lunarDay)}
                                            </Text>
                                            <Text className={`text-4xl font-black mb-1 ${omen.type === 'avoid' ? 'text-red-700' : 'text-green-700'}`}>
                                                {omen.type === 'avoid' ? '忌' : '宜'}
                                            </Text>
                                            <View className="border-t border-b border-gray-400/30 py-1 px-4 mt-2">
                                                <Text className="text-xl font-bold text-gray-900 tracking-widest text-center">
                                                    {omen.content['zh'].activityDisplayName}
                                                </Text>
                                            </View>

                                            {/* Decorative seal simulation */}
                                            <View className="absolute top-2 right-2 opacity-10 transform rotate-12 border-2 border-red-800 rounded-full w-10 h-10 items-center justify-center">
                                                <Text className="text-[8px] text-red-800 font-bold">通勝</Text>
                                            </View>
                                        </View>
                                    )}

                                    {language === 'en' ? (
                                        <View className="w-full flex-row items-center justify-center mb-4 space-x-2 gap-2">
                                            <View className={`flex-row items-center px-3 py-1 rounded-full ${omen.type === 'avoid' ? 'bg-red-50' : 'bg-green-50'}`}>
                                                <AntDesign name={omen.type === 'avoid' ? 'warning' : 'check-circle'} size={12} color={omen.type === 'avoid' ? '#ef4444' : '#22c55e'} />
                                                <Text className={`ml-1 text-[10px] font-bold tracking-widest uppercase ${omen.type === 'avoid' ? 'text-red-500' : 'text-green-500'}`}>
                                                    {omen.type === 'avoid' ? 'Avoid' : 'Do'}
                                                </Text>
                                            </View>
                                            <Text className="text-lg font-bold text-gray-800 tracking-wide">
                                                {omen.content['en'].activityDisplayName}
                                            </Text>
                                        </View>
                                    ) : (
                                        <View className="h-8 mb-4 w-full" />
                                    )}

                                    <View className="flex-1 w-full">
                                        <Text className="text-gray-700 leading-relaxed text-base font-normal text-center">
                                            {omen.content[language].explanation}
                                        </Text>
                                    </View>

                                    <View className="w-full h-[1px] bg-indigo-100 my-6" />

                                    <View className="items-center">
                                        <Text className="text-xs text-gray-400 uppercase tracking-widest">The Sign</Text>
                                    </View>
                                </>
                            )}
                        </Animated.View>
                    </View>
                </Pressable>
            </GestureDetector>
        </View>
    );
}
