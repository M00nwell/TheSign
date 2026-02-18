'use client'

import React, { useState } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import LoginModal from './login-modal'
import { useUser } from '@/providers/user-provider'

interface CardPackageProps {
    children: React.ReactNode
}

export default function CardPackage({ children }: CardPackageProps) {
    const { language, user } = useUser()
    const isAuthenticated = !!user

    const [status, setStatus] = useState<'closed' | 'opening' | 'opened'>('closed')
    const [tearDirection, setTearDirection] = useState<'left' | 'right' | null>(null)
    const [showLoginModal, setShowLoginModal] = useState(false)

    // Drag logic
    const x = useMotionValue(0)
    const rotate = useTransform(x, [-200, 200], [-5, 5])

    // Reset loop if user logs out
    React.useEffect(() => {
        if (!isAuthenticated) {
            setStatus('closed')
            x.set(0)
            setTearDirection(null)
        }
    }, [isAuthenticated, x])

    const handleDragEnd = (_: any, info: any) => {
        const offset = info.offset.x
        // Threshold to trigger open
        if (Math.abs(offset) > 100) {
            if (!isAuthenticated) {
                setShowLoginModal(true)
                // Reset position if denied
                // x.set(0) // Framer motion drag elastic usually handles snap back, but if we opened modal, we might want to ensure snap.
                // Actually the dragEnd won't snap back automatically if we don't return constraints?
                // The drag constraints usually handle snap back if released.
                return
            }

            setTearDirection(offset > 0 ? 'right' : 'left')
            setStatus('opening')
        }
    }

    const onTearComplete = () => {
        setStatus('opened')
    }

    const handleLoginSuccess = () => {
        setShowLoginModal(false)
        // Auto open after login?
        // Let's just let them interact again.
    }

    const today = new Date()
    const dateString = language === 'zh'
        ? today.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
        : today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    // If completely opened, just show children
    if (status === 'opened') {
        return (
            <div className="relative w-[340px] h-[520px] flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full"
                >
                    {children}
                </motion.div>
            </div>
        )
    }

    return (
        <div className="relative w-[340px] h-[520px] perspective-1000 flex items-center justify-center">
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onSuccess={handleLoginSuccess}
            />
            {/* Background glow meant to be behind the package */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle,rgba(168,85,247,0.2)_0%,rgba(59,130,246,0.2)_50%,transparent_70%)] pointer-events-none" />

            {/* 1. The Omen Card (Underlying Content) */}
            <div className={`absolute inset-0 z-10 transition-all duration-700 ease-out ${status === 'opening' ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                {children}
            </div>

            {/* 2. The Package (Overlay) - Draggable Wrapper */}
            <motion.div
                className="absolute inset-0 z-20 w-full h-full cursor-grab active:cursor-grabbing"
                drag={status === 'closed' ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                style={{ x, rotate }}
            >
                {/* --- TOP STRIP (The part that tears) --- */}
                <motion.div
                    className="absolute top-0 left-0 right-0 h-[85px] z-30"
                    animate={status === 'opening' ? {
                        x: tearDirection === 'right' ? 400 : -400, // Fly off sideways
                        y: -50, // Slight lift
                        rotate: tearDirection === 'right' ? 15 : -15,
                        opacity: 0
                    } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "circIn" }}
                >
                    {/* Strip Visuals */}
                    <div className="w-full h-full bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900 rounded-t-xl border-x border-t border-gray-600 shadow-xl overflow-hidden relative">
                        {/* Crimp Pattern at top */}
                        <div className="absolute top-0 left-0 right-0 h-3 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,#000_2px,#000_4px)] opacity-40 mix-blend-multiply" />

                        {/* Tear Indicator Area */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1 shadow-black drop-shadow-md">
                                {language === 'zh' ? '向两侧撕开' : 'Tear Open'}
                            </p>
                            <div className="flex gap-8 items-center justify-center px-4 w-full">
                                <motion.span
                                    className="text-white/40 text-lg font-light"
                                    animate={{ x: [-5, 0, -5] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                >
                                    ←
                                </motion.span>
                                {/* Dashed Line */}
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/30 to-transparent border-t border-dashed border-white/20" />
                                <motion.span
                                    className="text-white/40 text-lg font-light"
                                    animate={{ x: [5, 0, 5] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                >
                                    →
                                </motion.span>
                            </div>
                        </div>

                        {/* Bottom Tear Edge Visual (Mask or Border) */}
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/50 shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                    </div>
                </motion.div>


                {/* --- MAIN BODY (The rest of the package) --- */}
                <motion.div
                    className="absolute top-[82px] left-0 right-0 bottom-0 z-20"
                    animate={status === 'opening' ? {
                        y: 600, // Drop down
                        opacity: 0
                    } : { y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: "easeIn" }}
                    onAnimationComplete={() => {
                        if (status === 'opening') onTearComplete()
                    }}
                >
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-b-xl border-x border-b border-gray-700 shadow-2xl overflow-hidden relative">
                        {/* Foil/Texture Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                        <div className="absolute inset-0 opacity-[0.15] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

                        {/* Jagged Top Edge (Visual trick) - The "Torn" paper look */}
                        <div
                            className="absolute -top-[6px] left-0 right-0 h-[10px] bg-gray-800"
                            style={{
                                clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)'
                            }}
                        />

                        {/* Existing Content Layout */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-none space-y-8">

                            {/* Logo / Icon */}
                            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                                <span className="text-2xl">🔮</span>
                            </div>

                            {/* Date Display */}
                            <div className="flex flex-col items-center text-center space-y-4">
                                <h2 className="text-gray-400 font-serif tracking-widest text-xs uppercase mb-1">
                                    {language === 'zh' ? '今日运势' : 'Daily Omen'}
                                </h2>
                                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-sm px-4 leading-tight">
                                    {dateString}
                                </h1>
                                <div className="w-20 h-[1px] bg-white/10 my-4" />
                                <p className="text-white/30 text-[10px] tracking-[0.3em] font-light border border-white/10 px-3 py-1 rounded-full">
                                    {language === 'zh' ? '每日限定' : 'LIMITED EDITION'}
                                </p>
                            </div>
                        </div>

                        {/* Bottom Crimp */}
                        <div className="absolute bottom-0 left-0 right-0 h-3 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,#000_2px,#000_4px)] opacity-30" />
                    </div>
                </motion.div>

            </motion.div>
        </div>
    )
}
