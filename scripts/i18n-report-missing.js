const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const args = process.argv.slice(2);
const target = (args.find(a => a.startsWith('--target=')) || '').split('=')[1] || 'en';
const asJson = args.includes('--json');

const ruPath = join(process.cwd(), 'src/locales/ru/messages.json');
const enPath = join(process.cwd(), 'src/locales/en/messages.json');

if (!existsSync(ruPath) || !existsSync(enPath)) {
    console.error('Catalogs not found. Expected src/locales/{ru,en}/messages.json');
    process.exit(1);
}

const ru = JSON.parse(readFileSync(ruPath, 'utf8'));
const en = JSON.parse(readFileSync(enPath, 'utf8'));

const ids = Object.keys(ru);
const missing = [];

if (target === 'en') {
    for (const id of ids) {
        const v = en[id];
        if (!v || String(v).trim() === '') missing.push({ id, source: ru[id] || '' });
    }
} else if (target === 'ru') {
    for (const id of ids) {
        const v = ru[id];
        if (!v || String(v).trim() === '') missing.push({ id, fallback: en[id] || '' });
    }
} else {
    console.error('Unknown target, use --target=en or --target=ru');
    process.exit(2);
}

if (asJson) {
    console.log(JSON.stringify({ target, count: missing.length, missing }, null, 2));
} else {
    console.log(`Missing in ${target}: ${missing.length}`);
    for (const m of missing) {
        if (target === 'en') console.log(`- ${m.id}: ${m.source}`);
        else console.log(`- ${m.id}: ${m.fallback}`);
    }
}

process.exit(missing.length ? 1 : 0);
