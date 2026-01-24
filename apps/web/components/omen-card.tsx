'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'

export default function OmenCard() {
    const [isFlipped, setIsFlipped] = useState(false)
    const [isFlipping, setIsFlipping] = useState(false)

    const handleFlip = () => {
        if (!isFlipping) {
            setIsFlipping(true)
            setIsFlipped(!isFlipped)
        }
    }

    const today = new Date()
    const dateString = today.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    })

    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })

    return (
        <div className="perspective-1000 w-[340px] h-[520px] cursor-pointer" onClick={handleFlip}>
            <motion.div
                className="w-full h-full relative preserve-3d"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                onAnimationComplete={() => setIsFlipping(false)}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* FRONT FACE */}
                <div
                    className="absolute w-full h-full bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center justify-center p-8 overflow-hidden"
                    style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                    {/* Decorative glow */}
                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-white/5 rounded-full blur-[80px]" />

                    <div className="z-10 flex flex-col items-center text-center space-y-8">
                        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                            <Calendar className="w-10 h-10 text-gray-400" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl font-light tracking-widest text-gray-500 uppercase">{dayName}</h2>
                            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                {dateString}
                            </h1>
                        </div>

                        <p className="text-gray-600 text-sm font-light mt-8">Tap to reveal your sign</p>
                    </div>

                    {/* Card texture/noise overlay (optional CSS pattern could be here) */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                </div>

                {/* BACK FACE */}
                <div
                    className="absolute w-full h-full bg-white/90 rounded-3xl border border-gray-200 shadow-2xl flex flex-col items-center justify-between p-8 overflow-hidden"
                    style={{
                        transform: 'rotateY(180deg)',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden'
                    }}
                >

                    <div className="w-full flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-gray-100 p-6 mb-6 relative">
                        <div className="w-full h-full flex items-center justify-center relative">
                            {/* Placeholder road sign - using a reliable Unsplash source for "Road Sign" */}
                            <img
                                src="/sign.png"
                                alt="Road Sign"
                                className="max-w-full max-h-[220px] object-contain drop-shadow-lg"
                            />
                        </div>
                    </div>

                    <div className="text-center">
                        <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Daily Omen</h3>
                        <p className="text-xl font-serif text-gray-800 leading-relaxed italic">
                            "Caution is the parent of safety. Avoid rushing decisions today; waiting for the right signal is better than forcing a way through."
                        </p>
                    </div>

                    <div className="w-full mt-6 flex justify-center">
                        <div className="h-1 w-12 bg-gray-200 rounded-full" />
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
