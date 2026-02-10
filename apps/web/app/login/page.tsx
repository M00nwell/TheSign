'use client'

import { Suspense } from 'react'
import AuthForm from '@/components/auth-form'

export default function AuthPage() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden font-sans">
            {/* Ambient background effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />

            <Suspense fallback={<div className="text-white">Loading...</div>}>
                <AuthForm />
            </Suspense>
        </div>
    )
}

