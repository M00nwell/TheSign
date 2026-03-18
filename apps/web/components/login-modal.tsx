'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import AuthForm from './auth-form'
import { useUser } from '@/providers/user-provider'

interface LoginModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
    const { language, setLanguage } = useUser()

    if (!isOpen) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="relative w-full max-w-md pointer-events-auto">
                            {/* Language toggle — top left */}
                            <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-black/30 backdrop-blur-md border border-white/10 rounded-full p-1">
                                <button
                                    onClick={() => setLanguage('en')}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                        language === 'en'
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    EN
                                </button>
                                <button
                                    onClick={() => setLanguage('zh')}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                        language === 'zh'
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    中文
                                </button>
                            </div>

                            {/* Close */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 z-20 p-2 text-gray-400 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors backdrop-blur-md"
                            >
                                <X size={20} />
                            </button>

                            <AuthForm onSuccess={onSuccess} />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
