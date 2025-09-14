const { join, relative } = require('node:path');
const { existsSync, readdirSync, statSync, readFileSync, writeFileSync } = require('node:fs');
const { diffLines } = require('diff');
const jscodeshift = require('jscodeshift');

const DRY = process.argv.includes('--dry');
const projectRoot = process.cwd();
const codemodPath = join(projectRoot, 'codemods', 'lingui-wrap-strings.js');
const srcDir = join(projectRoot, 'src');

const color = {
    g: (s) => `\x1b[32m${s}\x1b[0m`,
    r: (s) => `\x1b[31m${s}\x1b[0m`,
    d: (s) => `\x1b[2m${s}\x1b[0m`,
    c: (s) => `\x1b[36;1m${s}\x1b[0m`,
};

if (!existsSync(codemodPath)) { console.error('codemod not found:', codemodPath); process.exit(1); }
if (!existsSync(srcDir)) { console.error('src/ not found:', srcDir); process.exit(1); }

const IGNORE_DIRS = [
    join(srcDir, 'app', 'api'),
    join(srcDir, 'shared', 'lib'),
];

const shouldIgnore = (p) => IGNORE_DIRS.some((dir) => p.startsWith(dir));
const j = jscodeshift.withParser('tsx');
const transform = require(codemodPath);

function walk(dir, acc) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        const s = statSync(p);
        if (s.isDirectory()) walk(p, acc);
        else if (!shouldIgnore(p) && (p.endsWith('.tsx') || p.endsWith('.jsx'))) acc.push(p);
    }
    return acc;
}

function printDiffHeader(file) {
    const rel = relative(projectRoot, file).replace(/\\/g, '/');
    console.log('\n' + color.c(`— ${rel}`));
}

function printDiff(before, after) {
    const a = before.replace(/\r\n/g, '\n');
    const b = after.replace(/\r\n/g, '\n');
    const diff = diffLines(a, b);
    for (const part of diff) {
        const fn = part.added ? color.g : part.removed ? color.r : color.d;
        const prefix = part.added ? '+' : part.removed ? '-' : ' ';
        const lines = part.value.split('\n');
        if (lines[lines.length - 1] === '') lines.pop();
        for (const line of lines) console.log(fn(`${prefix} ${line}`));
    }
}

const files = walk(srcDir, []);
if (!files.length) { console.log('No .tsx/.jsx files.'); process.exit(0); }

console.log(`Found ${files.length} UI files. ${DRY ? 'Dry-run with diff' : 'Applying changes'}`);

let changed = 0, errors = 0;

for (const file of files) {
    try {
        const before = readFileSync(file, 'utf8');
        const api = { jscodeshift: j, stats: () => {}, report: () => {}, printOptions: {} };
        const out = transform({ path: file, source: before }, api);
        const after = typeof out === 'string' ? out : null;
        if (!after || after === before) continue;
        changed++;
        if (DRY) { printDiffHeader(file); printDiff(before, after); }
        else { writeFileSync(file, after, 'utf8'); }
    } catch {
        errors++;
    }
}

console.log(`\nChanged: ${changed}  Errors: ${errors}`);
