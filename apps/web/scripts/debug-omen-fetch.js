
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    const targetId = '5a15e00b-738b-4473-9fb7-b0f560fb30bb';

    console.log("1. Direct Fetch omen_images");
    const { data: directData, error: directError } = await supabase
        .from('omen_images')
        .select('*')
        .eq('omen_id', targetId);

    if (directError) console.error("Direct Error:", directError);
    else console.log("Direct Data:", directData);

    console.log("\n2. Join via Omens");
    const { data: joinData, error: joinError } = await supabase
        .from('omens')
        .select(`
            id,
            omen_images (
                image_url
            )
        `)
        .eq('id', targetId);

    if (joinError) console.error("Join Error:", joinError);
    else {
        // @ts-ignore
        const imgs = joinData[0]?.omen_images;
        console.log("Type of omen_images:", typeof imgs);
        console.log("Is Array:", Array.isArray(imgs));
        console.log("Value:", JSON.stringify(imgs, null, 2));
    }
}

testFetch();
