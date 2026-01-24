
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const suitNamePath = path.join(__dirname, '../data/suit-name.json');
const omenSuitPath = path.join(__dirname, '../data/omen-suit.json');
const outputPath = path.join(__dirname, 'insert_omen_data.sql');

function generateSql() {
    if (!fs.existsSync(suitNamePath) || !fs.existsSync(omenSuitPath)) {
        console.error('Data files not found');
        return;
    }

    const suitNames = JSON.parse(fs.readFileSync(suitNamePath, 'utf8'));
    const omenSuits = JSON.parse(fs.readFileSync(omenSuitPath, 'utf8'));

    let sql = [];

    // Clean start
    sql.push('TRUNCATE suit_activity_translations, suit_activity_omens, omen_translations, omens, suit_activities CASCADE;');

    // 1. Process Suit Activities and Names
    suitNames.forEach(item => {
        const key = item.key.replace(/'/g, "''");
        const name_en = item.name_en.replace(/'/g, "''");
        const name_zh = item.name_zh.replace(/'/g, "''");

        sql.push(`INSERT INTO suit_activities (key) VALUES ('${key}') ON CONFLICT (key) DO NOTHING;`);
        sql.push(`INSERT INTO suit_activity_translations (suit_key, language_code, name) VALUES ('${key}', 'en', '${name_en}');`);
        sql.push(`INSERT INTO suit_activity_translations (suit_key, language_code, name) VALUES ('${key}', 'zh', '${name_zh}');`);
    });

    // 2. Process Omens
    omenSuits.forEach(item => {
        const activityKey = item.activity.replace(/'/g, "''");

        if (item.omens && Array.isArray(item.omens)) {
            item.omens.forEach(omen => {
                const omenId = crypto.randomUUID();

                sql.push(`INSERT INTO omens (id) VALUES ('${omenId}');`);
                sql.push(`INSERT INTO suit_activity_omens (suit_key, omen_id) VALUES ('${activityKey}', '${omenId}');`);

                const omen_en = (omen.omen_en || '').replace(/'/g, "''");
                const detail_en = (omen.detail_en || '').replace(/'/g, "''");
                const omen_zh = (omen.omen_zh || '').replace(/'/g, "''");
                const detail_zh = (omen.detail_zh || '').replace(/'/g, "''");

                sql.push(`INSERT INTO omen_translations (omen_id, language_code, omen_text, explanation) VALUES ('${omenId}', 'en', '${omen_en}', '${detail_en}');`);
                sql.push(`INSERT INTO omen_translations (omen_id, language_code, omen_text, explanation) VALUES ('${omenId}', 'zh', '${omen_zh}', '${detail_zh}');`);
            });
        }
    });

    fs.writeFileSync(outputPath, sql.join('\n'));
    console.log(`Generated ${sql.length} SQL statements to ${outputPath}`);
}

generateSql();
