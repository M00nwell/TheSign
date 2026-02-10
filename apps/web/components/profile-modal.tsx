'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@/providers/user-provider'
import { User, LogOut, RefreshCcw } from 'lucide-react'
import { signOut } from '@/app/actions/profile'
import Image from 'next/image'

interface ProfileModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { user, profile, refreshUser } = useUser()
    const [isSigningOut, setIsSigningOut] = useState(false)

    if (!isOpen || !user) return null

    const handleSignOut = async () => {
        setIsSigningOut(true)
        await signOut()
        await refreshUser()
        onClose()
        setIsSigningOut(false)
    }

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
                        className="relative z-10 w-80 bg-[#121212] border border-white/10 rounded-2xl shadow-xl p-6"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                {user.email?.[0].toUpperCase()}
                            </div>
                            <div className="text-center">
                                <h3 className="text-white font-medium text-lg truncate w-64">{user.email}</h3>
                                <p className="text-gray-400 text-sm">Member since {new Date(user.created_at).getFullYear()}</p>
                            </div>

                            <div className="w-full h-px bg-white/10 my-2" />

                            <div className="w-full space-y-2">
                                {/* Future: Add History or other links here */}
                                <button
                                    onClick={handleSignOut}
                                    disabled={isSigningOut}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-200 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition-all font-medium"
                                >
                                    <LogOut size={16} />
                                    {isSigningOut ? 'Signing out...' : 'Sign Out'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
