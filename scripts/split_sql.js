
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'insert_omen_data.sql');
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
const chunkSize = 50; // Reduced to 50 lines to avoid token limits

for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize).join('\n');
    fs.writeFileSync(path.join(__dirname, `sql_chunk_${String(Math.floor(i / chunkSize) + 1).padStart(3, '0')}.sql`), chunk);
}
console.log(`Created ${Math.ceil(lines.length / chunkSize)} chunks.`);
