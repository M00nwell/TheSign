'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import AuthForm from './auth-form'

interface LoginModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
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
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 z-20 p-2 text-gray-400 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors backdrop-blur-md"
                            >
                                <X size={20} />
                            </button>

                            {/* We reuse AuthForm but might need to adjust its styling slightly via className if needed */}
                            <AuthForm onSuccess={onSuccess} />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
