'use server'

import { createClient } from '@/lib/supabase/server'

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

export async function getDailyOmen(date: Date = new Date()): Promise<OmenData | null> {
    const supabase = await createClient()

    // 1. Get Almanac data for the date
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

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

    // 4. Fetch Omens for the selected activity
    let omens: any[] = []

    if (randomActivity.type === 'suit') {
        const { data, error } = await supabase
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
        const { data, error } = await supabase
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

    // Default fallback structure
    const fallbackContent: OmenContent = {
        text: "Omen data unavailable.",
        explanation: "Please try again later.",
        activityDisplayName: randomActivity.name
    }

    // 5. Random Selection of Omen
    if (!omens || omens.length === 0) {
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

    const randomOmen = omens[Math.floor(Math.random() * omens.length)]
    if (!randomOmen) return null

    // Extract translations
    // @ts-ignore
    const translations = randomOmen.omen_translations || []
    const enTrans = translations.find((t: any) => t.language_code === 'en')
    const zhTrans = translations.find((t: any) => t.language_code === 'zh')

    // Image logic
    // @ts-ignore
    const imgs = randomOmen.omen_images
    let imageUrl = null
    if (Array.isArray(imgs)) {
        imageUrl = imgs[0]?.image_url || null
    } else if (imgs) {
        imageUrl = imgs.image_url || null
    }

    // 6. Fetch Activity Translations (EN & ZH)
    // By default, the activity name in DB is often Chinese (e.g. '上梁').
    // We need 'en' translation for EN mode.
    // We can use the original name as ZH display name or fetch explicit translation if exists.
    let enActivityName = randomActivity.name
    let zhActivityName = randomActivity.name

    if (randomActivity.type === 'suit') {
        const { data } = await supabase
            .from('suit_activity_translations')
            .select('name, language_code')
            .eq('suit_key', randomActivity.name)
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
            .eq('avoid_key', randomActivity.name)
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
        activityName: randomActivity.name,
        type: randomActivity.type,
        almanac: {
            gzYear: almanacData.gz_year,
            lunarMonth: almanacData.lunar_month,
            lunarDay: almanacData.lunar_day
        }
    }

}
