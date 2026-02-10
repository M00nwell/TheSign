'use client'

import { useActionState, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { login, signup } from '@/app/login/actions'
import { AUTH_PROVIDERS, type AuthProvider } from '@repo/api'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/providers/user-provider'

const initialState = {
    error: undefined as string | undefined,
    message: undefined as string | undefined,
    success: false as boolean | undefined,
}


// Custom icons since Lucide doesn't have brand icons for Apple/Google usually
const Icons = {
    google: (props: any) => (
        <svg viewBox="0 0 24 24" {...props}>
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
        </svg>
    ),
    apple: (props: any) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.03 3.52-1.01 1.06.02 2.37.49 3.2 1.62-5.48 2.3-1.67 9.87 2.38 11.62-.5 1.12-1.25 2.22-2.18 3.06-.63.57-1.47 1.06-2 .94zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.16 2.29-2.02 4.16-3.74 4.25z" />
        </svg>
    ),
}

function SubmitButton({ isPending, isLogin }: { isPending: boolean; isLogin: boolean }) {
    return (
        <button
            type="submit"
            disabled={isPending}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] ${isPending
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-lg shadow-indigo-500/30'
                }`}
        >
            {isPending ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
        </button>
    )
}

function SocialLoginButtons() {
    const supabase = createClient()

    const handleOAuthSignIn = async (provider: AuthProvider) => {
        await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        })
    }

    return (
        <div className="flex flex-col gap-3 mt-4">
            {AUTH_PROVIDERS.map((provider) => {
                const Icon = Icons[provider.name as keyof typeof Icons]
                return (
                    <button
                        key={provider.name}
                        type="button"
                        onClick={() => handleOAuthSignIn(provider.name)}
                        className="flex items-center justify-center w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all group"
                    >
                        <Icon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                        <span className="text-gray-200 text-sm font-medium">{provider.label}</span>
                    </button>
                )
            })}
        </div>
    )
}

interface AuthFormProps {
    view?: 'login' | 'signup'
    onSuccess?: () => void
    className?: string
}

export default function AuthForm({ view, onSuccess, className }: AuthFormProps = {}) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { refreshUser } = useUser()
    const [isLogin, setIsLogin] = useState(true)

    useEffect(() => {
        if (view) {
            setIsLogin(view === 'login')
        } else if (searchParams.get('mode') === 'signup') {
            setIsLogin(false)
        }
    }, [searchParams, view])

    const action = isLogin ? login : signup
    const [state, formAction, isPending] = useActionState(action, initialState)

    useEffect(() => {
        if (state?.success) {
            refreshUser()
            if (onSuccess) {
                onSuccess()
            } else {
                router.push('/')
            }
        }
    }, [state?.success, onSuccess, router, refreshUser])

    // Optional: Call onSuccess if login/signup message indicates success? 
    // Usually standard actions redirect, but for modal we might need to know.
    // However, existing actions likely redirect to /?
    // Let's assume for now the standard flow works or simple state message is enough.

    return (
        <div className={`w-full max-w-md p-8 relative z-10 ${className || ''}`}>
            <div className="flex flex-col items-center mb-8">
                <h1 className="text-5xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500">
                    The Sign
                </h1>
                <p className="text-gray-400 mt-3 text-lg">
                    {isLogin ? 'Welcome back' : 'Create your account'}
                </p>
            </div>

            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl ring-1 ring-white/10">
                <form action={formAction} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Email
                        </label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="you@example.com"
                            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white placeholder-gray-600 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Password
                        </label>
                        <input
                            name="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white placeholder-gray-600 transition-all"
                        />
                    </div>

                    {state?.error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {state.error}
                        </div>
                    )}

                    {state?.message && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                            {state.message}
                        </div>
                    )}

                    <SubmitButton isPending={isPending} isLogin={isLogin} />
                </form>

                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="mx-4 text-gray-500 text-sm">Or continue with</span>
                    <div className="flex-grow border-t border-white/10"></div>
                </div>

                <SocialLoginButtons />

                <div className="mt-8 text-center pt-6 border-t border-white/10">
                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin)
                        }}
                        className="text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center w-full gap-2 group"
                    >
                        <span>{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
                        <span className="text-indigo-400 group-hover:underline decoration-indigo-400/30 underline-offset-4">{isLogin ? "Sign up" : "Sign in"}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
