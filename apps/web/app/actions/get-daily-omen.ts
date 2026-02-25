'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export interface OmenContent {
    text: string;
    explanation: string;
    activityDisplayName: string;
}

export interface OmenData {
    content: {
        en: OmenContent;
        zh: OmenContent;
    };
    imageUrl: string | null;
    activityName: string;
    type: 'suit' | 'avoid';
    almanac: {
        gzYear: string;
        lunarMonth: number;
        lunarDay: number;
    };
}

// Simple Seeded Random Number Generator (Linear ConGruential Generator)
// Removed


export async function getDailyOmen(date: Date = new Date(), forceNew = false): Promise<OmenData | null> {
    const supabase = await createClient()

    // 1. Get Almanac data for the date
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    // Format date as YYYY-MM-DD for DB storage/lookup (using local time components as intended for almanac)
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    const { data: almanacData, error: almanacError } = await supabase
        .from('almanac')
        .select('suit, avoid, gz_year, lunar_month, lunar_day')
        .eq('year', year)
        .eq('month', month)
        .eq('day', day)
        .single()

    if (almanacError || !almanacData) {
        console.error("Error fetching almanac:", almanacError)
        return null
    }

    // Check if user is logged in
    // Support both Cookie-based auth (Web) and Bearer Token auth (Mobile/API)
    let token: string | undefined;
    const headerStore = await headers();
    const authHeader = headerStore.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
    }

    // getUser() will use the cookie if no token is passed, or the token if passed.
    // However, createServerClient() instance is already bound to cookies. 
    // Passing a token to getUser() overrides the client's session context for that call.
    const { data: { user } } = await supabase.auth.getUser(token)

    let existingOmenId: string | null = null
    let existingActivityKey: string | null = null
    let existingActivityType: 'suit' | 'avoid' | null = null

    if (user) {
        // In dev mode with forceNew: wipe today's record so we always get a fresh random omen
        if (forceNew) {
            await supabase
                .from('user_daily_omens')
                .delete()
                .eq('user_id', user.id)
                .eq('date', dateStr)
        } else {
            // Check for existing daily omen
            const { data: dailyOmen } = await supabase
                .from('user_daily_omens')
                .select('omen_id, activity_key, activity_type')
                .eq('user_id', user.id)
                .eq('date', dateStr)
                .single()

            if (dailyOmen) {
                existingOmenId = dailyOmen.omen_id
                existingActivityKey = dailyOmen.activity_key
                existingActivityType = dailyOmen.activity_type as 'suit' | 'avoid'
            }
        }
    }

    let selectedOmen: any = null
    let activityName = existingActivityKey
    let activityType: 'suit' | 'avoid' = existingActivityType || 'suit' // Default, will be overwritten if fresh

    if (existingOmenId) {
        // Fetch specific omen data
        const { data: omenData, error } = await supabase
            .from('omens')
            .select(`
                id,
                omen_translations (
                    language_code,
                    omen_text,
                    explanation
                ),
                omen_images (
                    image_url
                )
            `)
            .eq('id', existingOmenId)
            .single()

        if (omenData) {
            selectedOmen = omenData
        }
    }

    // If no existing omen found or fetch failed, generate new one
    if (!selectedOmen) {
        // 2. Parse Activities
        const { suit, avoid } = almanacData
        const activities: { name: string; type: 'suit' | 'avoid' }[] = []

        if (suit) {
            activities.push(...(suit.split('.') as string[]).filter(Boolean).map((s: string) => ({ name: s, type: 'suit' as const })))
        }
        if (avoid) {
            activities.push(...(avoid.split('.') as string[]).filter(Boolean).map((s: string) => ({ name: s, type: 'avoid' as const })))
        }

        if (activities.length === 0) return null

        // 3. Random Selection of Activity
        const randomActivity = activities[Math.floor(Math.random() * activities.length)]

        // Safety check
        if (!randomActivity) return null

        activityName = randomActivity.name
        activityType = randomActivity.type

        // 4. Fetch Omens for the selected activity
        let omens: any[] = []

        if (randomActivity.type === 'suit') {
            const { data } = await supabase
                .from('suit_activity_omens')
                .select(`
                omen_id,
                omens (
                    id,
                    omen_translations (
                        language_code,
                        omen_text,
                        explanation
                    ),
                    omen_images (
                        image_url
                    )
                )
            `)
                .eq('suit_key', randomActivity.name)

            if (data) omens = data.map(d => d.omens).filter(Boolean)
        } else {
            const { data } = await supabase
                .from('avoid_activity_omens')
                .select(`
                omen_id,
                omens (
                    id,
                    omen_translations (
                        language_code,
                        omen_text,
                        explanation
                    ),
                    omen_images (
                        image_url
                    )
                )
            `)
                .eq('avoid_key', randomActivity.name)

            if (data) omens = data.map(d => d.omens).filter(Boolean)
        }

        // 5. Random Selection of Omen
        if (!omens || omens.length === 0) {
            // Default fallback structure if NO omens found for activity
            // ... (Return fallback object logic, see below)
            // For brevity, using the same fallback content structure
            const fallbackContent: OmenContent = {
                text: "Omen data unavailable.",
                explanation: "Please try again later.",
                activityDisplayName: randomActivity.name
            }
            return {
                content: {
                    en: fallbackContent,
                    zh: fallbackContent
                },
                imageUrl: null,
                activityName: randomActivity.name,
                type: randomActivity.type,
                almanac: {
                    gzYear: almanacData.gz_year,
                    lunarMonth: almanacData.lunar_month,
                    lunarDay: almanacData.lunar_day
                }
            }
        }

        selectedOmen = omens[Math.floor(Math.random() * omens.length)]

        // If user is logged in, save this selection!
        if (user && selectedOmen) {
            await supabase.from('user_daily_omens').upsert({
                user_id: user.id,
                date: dateStr,
                omen_id: selectedOmen.id,
                activity_key: activityName,
                activity_type: activityType
            }, { onConflict: 'user_id, date' })
        }
    }

    if (!selectedOmen) return null

    // Extract translations
    // @ts-ignore
    const translations = selectedOmen.omen_translations || []
    const enTrans = translations.find((t: any) => t.language_code === 'en')
    const zhTrans = translations.find((t: any) => t.language_code === 'zh')

    // Image logic
    // @ts-ignore
    const imgs = selectedOmen.omen_images
    let imageUrl = null
    if (Array.isArray(imgs)) {
        imageUrl = imgs[0]?.image_url || null
    } else if (imgs) {
        imageUrl = imgs.image_url || null
    }

    // 6. Fetch Activity Translations (EN & ZH)
    let enActivityName = activityName!
    let zhActivityName = activityName!

    if (activityType === 'suit') {
        const { data } = await supabase
            .from('suit_activity_translations')
            .select('name, language_code')
            .eq('suit_key', activityName)
            .in('language_code', ['en', 'zh'])

        if (data) {
            const en = data.find(d => d.language_code === 'en')
            if (en) enActivityName = en.name
            const zh = data.find(d => d.language_code === 'zh')
            if (zh) zhActivityName = zh.name
        }
    } else {
        const { data } = await supabase
            .from('avoid_activity_translations')
            .select('name, language_code')
            .eq('avoid_key', activityName)
            .in('language_code', ['en', 'zh'])

        if (data) {
            const en = data.find(d => d.language_code === 'en')
            if (en) enActivityName = en.name
            const zh = data.find(d => d.language_code === 'zh')
            if (zh) zhActivityName = zh.name
        }
    }

    // Construct final data
    return {
        content: {
            en: {
                text: enTrans?.omen_text || "Omen text missing",
                explanation: enTrans?.explanation || "No interpretation available.",
                activityDisplayName: enActivityName
            },
            zh: {
                text: zhTrans?.omen_text || enTrans?.omen_text || "Omen text missing",
                explanation: zhTrans?.explanation || enTrans?.explanation || "No interpretation available.",
                activityDisplayName: zhActivityName
            }
        },
        imageUrl,
        activityName: activityName!,
        type: activityType!,
        almanac: {
            gzYear: almanacData.gz_year,
            lunarMonth: almanacData.lunar_month,
            lunarDay: almanacData.lunar_day
        }
    }
}

