/* eslint-disable no-console */
const { join, relative } = require('node:path')
const { existsSync, readdirSync, statSync, readFileSync, writeFileSync } = require('node:fs')
const { diffLines } = require('diff')
const jscodeshift = require('jscodeshift')

const args = process.argv.slice(2)
const DRY = args.includes('--dry')

const projectRoot = process.cwd()
const codemodPath = join(projectRoot, 'codemods', 'lingui-t-to-msg.js')
const srcDir = join(projectRoot, 'src')

const IGNORE_DIRS = [
    join(srcDir, 'app', 'api'),
    join(srcDir, 'shared', 'lib'),
    join(srcDir, 'generated'),
    join(srcDir, '__tests__'),
]

const EXTS = new Set(['.tsx', '.jsx'])

const color = {
    g: s => `\x1b[32m${s}\x1b[0m`,
    r: s => `\x1b[31m${s}\x1b[0m`,
    d: s => `\x1b[2m${s}\x1b[0m`,
    c: s => `\x1b[36;1m${s}\x1b[0m`,
    y: s => `\x1b[33m${s}\x1b[0m`,
}

function fail(msg) { console.error(color.r(msg)); process.exit(1) }

if (!existsSync(codemodPath)) fail(`codemod not found: ${codemodPath}`)
if (!existsSync(srcDir)) fail(`src/ not found: ${srcDir}`)

const shouldIgnore = (p) => IGNORE_DIRS.some((dir) => p.startsWith(dir))

const j = jscodeshift.withParser('tsx')
const transform = require(codemodPath)

function walk(dir, acc) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name)
        const s = statSync(p)
        if (s.isDirectory()) {
            if (!shouldIgnore(p)) walk(p, acc)
        } else {
            const ext = name.slice(name.lastIndexOf('.'))
            if (!shouldIgnore(p) && EXTS.has(ext)) acc.push(p)
        }
    }
    return acc
}

function printDiffHeader(file) {
    const rel = relative(projectRoot, file).replace(/\\/g, '/')
    console.log('\n' + color.c(`— ${rel}`))
}

function printDiff(before, after) {
    const a = before.replace(/\r\n/g, '\n')
    const b = after.replace(/\r\n/g, '\n')
    const diff = diffLines(a, b)
    for (const part of diff) {
        const fn = part.added ? color.g : part.removed ? color.r : color.d
        const prefix = part.added ? '+' : part.removed ? '-' : ' '
        const lines = part.value.split('\n')
        if (lines[lines.length - 1] === '') lines.pop()
        for (const line of lines) console.log(fn(`${prefix} ${line}`))
    }
}

const files = walk(srcDir, [])
if (!files.length) {
    console.log(color.y('No .tsx/.jsx files found — nothing to do.'))
    process.exit(0)
}

console.log(color.c(`Found ${files.length} UI files. ${DRY ? 'Dry-run with diff' : 'Applying changes'}`))

let changed = 0, errors = 0, touched = 0

for (const file of files) {
    try {
        const before = readFileSync(file, 'utf8')
        const api = { jscodeshift: j, stats: () => {}, report: () => {}, printOptions: {} }
        const out = transform({ path: file, source: before }, api)
        const after = typeof out === 'string' ? out : null

        if (!after || after === before) continue

        touched++
        if (DRY) {
            printDiffHeader(file)
            printDiff(before, after)
        } else {
            writeFileSync(file, after, 'utf8')
            changed++
        }
    } catch (e) {
        errors++
        console.error(color.r(`\n✖ Error in ${relative(projectRoot, file).replace(/\\/g, '/')}`))
        console.error(e && e.stack ? e.stack : e)
    }
}

console.log(color.c(`\nDone.`))
console.log(`Touched: ${touched}  ${DRY ? '' : `Written: ${changed}  `}Errors: ${errors}`)
if (DRY && touched === 0) {
    console.log(color.y('Nothing would change.'))
}
