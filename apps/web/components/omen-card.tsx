'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation, PanInfo, animate } from 'framer-motion'
import { Calendar, X, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import Image from 'next/image'
import { getDailyOmen, OmenData } from '../app/actions/get-daily-omen'
import { useUser } from '@/providers/user-provider'

// Module-level variable to deduplicate fetches (Double-Lock)
// This prevents React Strict Mode or fast re-mounts from triggering two network requests.
let activeFetchPromise: Promise<OmenData | null> | null = null;

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

    if (d < 11) return prefix + digits[lastDigit]; // 1-9 -> 初一..初九

    // 11-19: 十一..十九. 10 is '初十'? No, usually 10 is 初十 in array index 0 logic?
    // Let's rely on map.

    const chineseDays = [
        '', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
        '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
        '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
    ];
    return chineseDays[d] || d.toString();
}


export default function OmenCard() {
    const [isFlipped, setIsFlipped] = useState(false)
    const [omenData, setOmenData] = useState<OmenData | null>(null)
    const [loading, setLoading] = useState(true)
    const [imageError, setImageError] = useState(false)
    const { language } = useUser()

    // Animation controls
    const x = useMotionValue(0)
    const rotateY = useMotionValue(0)
    const baseRotation = useRef(0)
    const controls = useAnimation()

    // Drive rotation manually
    const handleDrag = (event: any, info: PanInfo) => {
        const rotationOffset = info.offset.x * 0.72
        rotateY.set(baseRotation.current + rotationOffset)
    }

    const handleDevReload = async () => {
        setLoading(true)
        // Match key generation from useEffect
        const todayKey = new Date().toLocaleDateString('en-CA')
        const storageKey = `daily-omen-v4-${todayKey}`
        localStorage.removeItem(storageKey)

        // Reset fetch promise
        activeFetchPromise = null;

        // Reset Animation/State
        rotateY.set(0)
        baseRotation.current = 0
        x.set(0)
        setIsFlipped(false)
        setImageError(false)

        try {
            const data = await getDailyOmen()
            if (data) {
                localStorage.setItem(storageKey, JSON.stringify(data))
                setOmenData(data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        setImageError(false)
    }, [omenData])

    // Fetch Logic
    useEffect(() => {
        async function loadOmen() {
            setLoading(true)
            try {
                // 1. Check Local Storage
                const todayKey = new Date().toLocaleDateString('en-CA')
                const storageKey = `daily-omen-v4-${todayKey}`
                const cached = localStorage.getItem(storageKey)

                if (cached) {
                    setOmenData(JSON.parse(cached))
                    setLoading(false)
                    return
                }

                // 2. Fetch if not cached (Deduplicated)
                if (!activeFetchPromise) {
                    activeFetchPromise = getDailyOmen().finally(() => {
                        activeFetchPromise = null
                    })
                }

                const data = await activeFetchPromise

                if (data) {
                    localStorage.setItem(storageKey, JSON.stringify(data))
                    setOmenData(data)
                }
            } catch (error) {
                console.error("Failed to fetch omen", error)
            } finally {
                setLoading(false)
            }
        }
        loadOmen()
    }, [])

    const handleDragEnd = (event: any, info: PanInfo) => {
        const threshold = 100
        const velocityThreshold = 500
        const offset = info.offset.x
        const velocity = info.velocity.x

        let newBase = baseRotation.current

        // Determine snap target
        if (offset > threshold || velocity > velocityThreshold) {
            newBase += 180
        } else if (offset < -threshold || velocity < -velocityThreshold) {
            newBase -= 180
        }

        baseRotation.current = newBase

        // 1. Animate visual card
        animate(rotateY, newBase, { type: "spring", stiffness: 300, damping: 30 })

        // 2. Reset the drag sensor immediately to 0
        controls.start({ x: 0, transition: { duration: 0 } })

        // 3. Update logical state
        const normalized = Math.abs(newBase % 360)
        setIsFlipped(normalized === 180)
    }

    const FallbackImage = '/sign.png'

    return (
        <div className="relative w-[340px] h-[520px] select-none">
            {process.env.NODE_ENV === 'development' && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDevReload();
                    }}
                    className="absolute top-4 left-4 z-[100] bg-gray-100 px-2 py-1 rounded opacity-50 text-[10px] text-gray-500 hover:opacity-100 transition-opacity cursor-pointer"
                >
                    Dev Reload
                </button>
            )}
            {/* 1. Drag Sensor (Invisible Top Layer) */}
            <motion.div
                className="absolute inset-0 z-50 cursor-grab active:cursor-grabbing"
                style={{ x }} // This element moves with drag, but is invisible
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={controls}
            />

            {/* 2. Visual Card (Reacts to sensor) */}
            <div className={`perspective-1000 w-full h-full pointer-events-none`}>
                <motion.div
                    className="w-full h-full relative preserve-3d"
                    style={{
                        rotateY, // Driven by the sensor's x
                        transformStyle: 'preserve-3d',
                    }}
                >
                    {/* FRONT FACE: The Omen Result (Image + Text) */}
                    {/* FRONT FACE: The Omen Result (Image + Text) */}
                    <div
                        className="absolute w-full h-full bg-white rounded-3xl border border-gray-200 shadow-2xl flex flex-col items-center justify-between p-6"
                        style={{
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transformStyle: 'preserve-3d',
                            transform: 'translateZ(1px)'
                        }}
                    >
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-4">
                                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                <p className="text-gray-400 text-sm font-medium animate-pulse">Consulting the oracles...</p>
                            </div>
                        ) : omenData ? (
                            <>
                                <div className="relative w-full h-full -mt-8" style={{ transformStyle: 'preserve-3d' }}>
                                    <motion.div
                                        className="relative w-full h-full"
                                        style={{ transform: 'translateZ(16px)', filter: 'drop-shadow(0 20px 20px rgba(0,0,0,0.3))' }}
                                    >
                                        <Image
                                            src={(!imageError && omenData.imageUrl) ? omenData.imageUrl : '/sign.png'}
                                            alt="Omen Sign"
                                            fill
                                            className="object-contain scale-[1.1] -translate-y-4"
                                            onError={() => setImageError(true)}
                                            unoptimized
                                        />
                                    </motion.div>
                                </div>

                                <div className="w-full flex-1 flex flex-col items-center justify-center text-center -mt-32 z-10">
                                    <p className="text-2xl font-serif italic text-gray-600 leading-tight px-2">
                                        {omenData.content[language].text}
                                    </p>
                                </div>

                                <div className="mt-4 text-xs text-gray-400 font-medium tracking-wide uppercase">
                                    {language === 'en' ? 'Swipe to Interpret' : '滑动查看解读'}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <p>No omen found for today.</p>
                            </div>
                        )}
                        {/* Card texture/grain */}
                        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
                    </div>

                    {/* BACK FACE: The Explanation */}
                    <div
                        className="absolute w-full h-full bg-slate-50 rounded-3xl border border-indigo-100 shadow-2xl flex flex-col items-center p-8 pt-16 pointer-events-auto"
                        style={{
                            transform: 'rotateY(180deg) translateZ(1px)',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transformStyle: 'preserve-3d'
                        }}
                    >
                        {omenData && (
                            <>


                                {omenData.almanac && (
                                    <div className="w-[80%] bg-[#f4e4bc] relative rounded-sm p-4 mb-4 shadow-xl border border-[#e6d2a0] flex flex-col items-center justify-center font-serif text-gray-800"
                                        style={{
                                            backgroundImage: "url('https://www.transparenttextures.com/patterns/aged-paper.png')",
                                            transform: 'translateZ(15px)', // Pop out
                                        }}>
                                        {/* Ancient Almanac Content (Always Traditional Chinese) */}
                                        <div className="text-sm tracking-widest mb-1 opacity-80 font-medium">
                                            {omenData.almanac.gzYear}年
                                        </div>
                                        <div className="text-lg font-bold tracking-widest mb-2 text-[#8b5a2b]">
                                            {toChineseLunarMonth(omenData.almanac.lunarMonth)}月{toChineseLunarDay(omenData.almanac.lunarDay)}
                                        </div>
                                        <div className={`text-4xl font-black mb-1 font-serif ${omenData.type === 'avoid' ? 'text-red-700' : 'text-green-700'}`}>
                                            {omenData.type === 'avoid' ? '忌' : '宜'}
                                        </div>
                                        <div className="text-xl font-bold tracking-widest text-gray-900 border-t border-b border-gray-400/30 py-1 px-4 mt-2">
                                            {omenData.content['zh'].activityDisplayName}
                                        </div>

                                        {/* Decorative stamp/seal visual could go here */}
                                        <div className="absolute top-2 right-2 opacity-10 pointer-events-none">
                                            <div className="w-12 h-12 border-2 border-red-800 rounded-full flex items-center justify-center text-[10px] text-red-800 rotate-12">
                                                通勝
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {language === 'en' ? (
                                    <div className="flex items-center justify-center gap-3 mb-4 w-full" style={{ transform: 'translateZ(10px)' }}>
                                        <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${omenData.type === 'avoid' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                            {omenData.type === 'avoid' ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                                            <span className="text-xs font-bold tracking-widest uppercase">
                                                {omenData.type === 'avoid' ? 'Avoid' : 'Do'}
                                            </span>
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-800 tracking-wide">
                                            {omenData.content['en'].activityDisplayName}
                                        </h2>
                                    </div>
                                ) : (
                                    <div className="h-8 mb-4 w-full" />
                                )}

                                <div className="flex-1 overflow-y-auto w-full pr-2 custom-scrollbar flex flex-col justify-start pt-2">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2 block text-center hidden">{omenData.content[language].activityDisplayName}</h2>
                                    <p className="text-gray-700 leading-relaxed text-base font-normal whitespace-pre-wrap text-center">
                                        {omenData.content[language].explanation}
                                    </p>
                                </div>

                                <div className="w-full h-[1px] bg-indigo-100 my-6" />

                                <div className="text-center">
                                    <p className="text-xs text-gray-400 uppercase tracking-widest">The Sign</p>
                                </div>
                            </>
                        )}
                        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
                    </div>
                </motion.div>
            </div >
        </div >
    )
}
