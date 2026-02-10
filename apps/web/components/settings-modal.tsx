'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@/providers/user-provider'
import { Globe, X, Palette, Bell } from 'lucide-react'

interface SettingsModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { language: currentLang, setLanguage } = useUser()

    if (!isOpen) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative z-10 w-80 md:w-96 bg-[#121212] border border-white/10 rounded-2xl shadow-xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                            <h2 className="text-white font-medium flex items-center gap-2">
                                Settings
                            </h2>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-4 space-y-6">
                            {/* Language Setting */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <Globe size={14} /> Language / 语言
                                </label>
                                <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-lg border border-white/5">
                                    <button
                                        onClick={() => setLanguage('en')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${currentLang === 'en'
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        English
                                    </button>
                                    <button
                                        onClick={() => setLanguage('zh')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${currentLang === 'zh'
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        中文 (Chinese)
                                    </button>
                                </div>
                            </div>

                            {/* Stubs for future settings */}
                            <div className="space-y-3 opacity-50 pointer-events-none">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <Palette size={14} /> Theme (Coming Soon)
                                </label>
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 ring-2 ring-white/20"></div>
                                    <div className="w-8 h-8 rounded-full bg-emerald-600"></div>
                                    <div className="w-8 h-8 rounded-full bg-rose-600"></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
