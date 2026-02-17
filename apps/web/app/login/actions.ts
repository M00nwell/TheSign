'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface AuthActionState {
    error?: string
    message?: string
    success?: boolean
}

export async function login(prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}

export async function signup(prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error, data } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    if (data?.user && !data.session) {
        return { message: 'Check your email for the confirmation link.' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}
