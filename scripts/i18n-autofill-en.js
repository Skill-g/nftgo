const { readFileSync, writeFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const ruPath = join(process.cwd(), 'src/locales/ru/messages.json');
const enPath = join(process.cwd(), 'src/locales/en/messages.json');

if (!existsSync(ruPath) || !existsSync(enPath)) {
    console.error('Missing locales. Expected:', ruPath, 'and', enPath);
    process.exit(1);
}

const ru = JSON.parse(readFileSync(ruPath, 'utf8'));
const en = JSON.parse(readFileSync(enPath, 'utf8'));

const isASCII = (s) => /^[\x00-\x7F]+$/.test(s);
const isOnlyPunct = (s) => /^[-–—.,!?:;()[\]{}'"«»…\s/\\0-9]+$/.test(s);

let filled = 0;

for (const id of Object.keys(ru)) {
    const src = ru[id];
    if (typeof src !== 'string') continue;
    if (en[id] && String(en[id]).trim() !== '') continue;

    const text = src.trim();
    if (!text) continue;

    const looksEnglish = isASCII(text) && !isOnlyPunct(text);

    if (looksEnglish) {
        en[id] = text;
        filled++;
    }
}

writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
console.log(`Autofilled EN translations: ${filled}`);
