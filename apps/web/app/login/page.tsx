'use client'

import { Suspense } from 'react'
import AuthForm from '@/components/auth-form'

export default function AuthPage() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden font-sans">
            {/* Ambient background effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(139,92,246,0.1)_0%,rgba(139,92,246,0)_70%)] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[radial-gradient(circle,rgba(99,102,241,0.1)_0%,rgba(99,102,241,0)_70%)] pointer-events-none" />

            <Suspense fallback={<div className="text-white">Loading...</div>}>
                <AuthForm />
            </Suspense>
        </div>
    )
}

