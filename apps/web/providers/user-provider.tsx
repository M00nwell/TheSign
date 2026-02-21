'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getProfile, updateProfile } from '@/app/actions/profile'
import { useRouter } from 'next/navigation'

interface UserContextType {
    user: any | null
    profile: any | null
    isLoading: boolean
    language: 'en' | 'zh'
    setLanguage: (lang: 'en' | 'zh') => Promise<void>
    refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
    user: null,
    profile: null,
    isLoading: true,
    language: 'en',
    setLanguage: async () => { },
    refreshUser: async () => { },
})

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any | null>(null)
    const [profile, setProfile] = useState<any | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [detectedLanguage, setDetectedLanguage] = useState<'en' | 'zh'>('en')
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        // Prefer previously saved language, then browser language
        const saved = localStorage.getItem('language') as 'en' | 'zh' | null
        if (saved === 'en' || saved === 'zh') {
            setDetectedLanguage(saved)
        } else {
            const browserLang = navigator.language
            setDetectedLanguage(browserLang.toLowerCase().startsWith('zh') ? 'zh' : 'en')
        }
    }, [])

    const fetchUserData = async () => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            if (user) {
                const profileData = await getProfile()
                setProfile(profileData)

                // If profile exists but language is null (unset), use detected
                // We save it so it persists for next time
                if (profileData && !profileData.language) {
                    const browserLang = navigator.language
                    const isZh = browserLang.toLowerCase().startsWith('zh')
                    const autoLang = isZh ? 'zh' : 'en'

                    // Optimistic update locally
                    setProfile({ ...profileData, language: autoLang })
                    // Async update DB
                    updateProfile({ language: autoLang }).catch(console.error)
                }
            } else {
                setProfile(null)
            }
        } catch (error) {
            console.error('Error in user provider:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUserData()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                getProfile().then(async (data) => {
                    setProfile(data)
                    // Logic duplication here, but 'fetchUserData' covers the initial load.
                    // For re-auth, we check:
                    if (data && !data.language) {
                        const browserLang = navigator.language
                        const isZh = browserLang.toLowerCase().startsWith('zh')
                        const autoLang = isZh ? 'zh' : 'en'
                        setProfile({ ...data, language: autoLang })
                        updateProfile({ language: autoLang }).catch(console.error)
                    }
                })
            } else {
                setProfile(null)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const setLanguage = async (lang: 'en' | 'zh') => {
        // Always persist locally for immediate feedback & guest users
        localStorage.setItem('language', lang)

        if (!user) {
            // Not logged in — local storage is the only store
            setDetectedLanguage(lang)
            return
        }

        // Logged in — update profile optimistically then sync to DB
        setProfile((prev: any) => ({ ...prev, language: lang }))
        try {
            await updateProfile({ language: lang })
            router.refresh()
        } catch (error) {
            console.error('Failed to update language', error)
            fetchUserData()
        }
    }

    // Computed language: Profile (DB) > localStorage > Browser detection > 'en'
    const storedLang = typeof window !== 'undefined' ? localStorage.getItem('language') as 'en' | 'zh' | null : null
    const language = (profile?.language || storedLang || detectedLanguage) as 'en' | 'zh'


    return (
        <UserContext.Provider value={{ user, profile, isLoading, language, setLanguage, refreshUser: fetchUserData }}>
            {children}
        </UserContext.Provider>
    )
}

export const useUser = () => useContext(UserContext)
