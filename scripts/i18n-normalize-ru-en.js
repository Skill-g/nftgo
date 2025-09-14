const { readFileSync, writeFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const ruPath = join(process.cwd(), 'src/locales/ru/messages.json');
const enPath = join(process.cwd(), 'src/locales/en/messages.json');

if (!existsSync(ruPath) || !existsSync(enPath)) {
    console.error('Missing catalogs:', ruPath, enPath);
    process.exit(1);
}

const ru = JSON.parse(readFileSync(ruPath, 'utf8'));
const en = JSON.parse(readFileSync(enPath, 'utf8'));

const isASCII = (s) => /^[\x00-\x7F]+$/.test(s);
const isOnlyPunct = (s) => /^[-–—.,!?:;()[\]{}'"«»…\s/\\0-9]+$/.test(s);

let moved = 0;

for (const id of Object.keys(ru)) {
    const val = ru[id];
    if (typeof val !== 'string') continue;
    const text = val.trim();
    if (!text) continue;

    const looksEnglish = isASCII(text) && !isOnlyPunct(text);
    if (looksEnglish) {
        if (!en[id] || String(en[id]).trim() === '') {
            en[id] = text;
        }
        if (ru[id] !== '') {
            ru[id] = '';
            moved++;
        }
    }
}

writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
writeFileSync(ruPath, JSON.stringify(ru, null, 2) + '\n', 'utf8');
console.log(`Moved ${moved} EN-looking entries from ru → en and cleared them in ru.`);
