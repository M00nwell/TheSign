import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config({ path: 'apps/web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const signsDir = 'C:\\Users\\fuwen\\Downloads\\signs';
const bucketName = 'omen-signs';

async function uploadImages() {
    if (!fs.existsSync(signsDir)) {
        console.error(`Directory not found: ${signsDir}`);
        process.exit(1);
    }

    const files = fs.readdirSync(signsDir).filter(f => f.endsWith('.png'));

    console.log(`Found ${files.length} PNG files.`);

    let successCount = 0;
    let failureCount = 0;

    for (const file of files) {
        const uuid = path.parse(file).name;
        const filePath = path.join(signsDir, file);
        const fileBuffer = fs.readFileSync(filePath);

        console.log(`Processing ${uuid}...`);

        // Upload to Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(`${uuid}.png`, fileBuffer, {
                upsert: true,
                contentType: 'image/png'
            });

        if (uploadError) {
            console.error(`  Upload failed for ${file}:`, uploadError.message);
            failureCount++;
            // If upload fails, maybe it's already there? or permission issue.
        }

        // Get Public URL regardless of upload error (if it was "Duplicate" maybe we proceed? But upsert is true)

        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(`${uuid}.png`);

        // Insert into DB
        const { error: dbError } = await supabase
            .from('omen_images')
            .upsert({
                omen_id: uuid,
                image_url: publicUrl
            });

        if (dbError) {
            console.error(`  DB Insert failed for ${file}:`, dbError.message);
            failureCount++;
        } else {
            console.log(`  Success! URL: ${publicUrl}`);
            successCount++;
        }
    }

    console.log(`Done. Success: ${successCount}, Failures: ${failureCount}`);
}

uploadImages();
