'use client'

import React, { useState } from 'react'
import { Settings, User, LogIn } from 'lucide-react'
import { useUser } from '@/providers/user-provider'
import ProfileModal from './profile-modal'
import SettingsModal from './settings-modal'
import LoginModal from './login-modal'

export default function Header() {
    const { user, isLoading } = useUser()
    const [showProfile, setShowProfile] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    const [showLogin, setShowLogin] = useState(false)

    // Handle Profile Click
    const handleProfileClick = () => {
        if (!user) {
            setShowLogin(true)
        } else {
            setShowProfile(true)
        }
    }

    return (
        <>
            <header className="fixed top-0 left-0 w-full z-40 px-6 py-6 flex justify-between items-start pointer-events-none">
                {/* Settings Trigger */}
                <button
                    onClick={() => setShowSettings(true)}
                    className="pointer-events-auto p-3 bg-black/20 backdrop-blur-md rounded-full text-white/70 hover:text-white border border-white/5 hover:bg-black/40 transition-all hover:scale-105 active:scale-95 group"
                    aria-label="Settings"
                >
                    <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                </button>

                {/* Profile Trigger */}
                {/* Profile Trigger - Only show if logged in */}
                {user && (
                    <button
                        onClick={handleProfileClick}
                        className="pointer-events-auto group relative"
                        aria-label="Profile"
                    >
                        <div className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white/70 hover:text-white border border-white/5 hover:bg-black/40 transition-all hover:scale-105 active:scale-95 flex items-center justify-center overflow-hidden">
                            <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                                {user.email?.[0].toUpperCase()}
                            </div>
                        </div>
                    </button>
                )}
            </header>

            {/* Modals */}
            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
            <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
            <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />
        </>
    )
}
