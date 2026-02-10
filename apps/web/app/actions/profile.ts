'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // If no profile exists (e.g. old user before trigger), create one
    if (error && error.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({ id: user.id })
            .select()
            .single()

        if (createError) {
            console.error('Error creating profile fallback:', createError)
            return null
        }
        return newProfile
    }

    if (error) {
        console.error('Error fetching profile:', error)
        return null
    }

    return data
}

export async function updateProfile(data: { language?: 'en' | 'zh' }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id)

    if (error) throw new Error(error.message)

    revalidatePath('/')
    return { success: true }
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/')
}
