import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '../../..')

const SCAN_DIRS = ['src', 'supabase']
const IGNORE = new Set(['node_modules', '.git', 'dist', 'coverage', 'tests', 'vendor'])

const PATTERNS = [
  { name: 'supabase-jwt', re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
  { name: 'service-role-key', re: /sbp_[A-Za-z0-9]{20,}/g },
  { name: 'anon-key-with-project', re: /https?:\/\/[a-z0-9]{20,}\.supabase\.co/g },
  { name: 'postgres-connection-string', re: /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/g },
]

function walk(dir, acc) {
  for (const entry of readdirSync(dir)) {
    if (IGNORE.has(entry)) continue
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      walk(full, acc)
    } else if (/\.(ts|tsx|js|mjs|json|sql|yml|yaml|toml|env)$/.test(entry)) {
      acc.push(full)
    }
  }
}

const files = []
for (const d of SCAN_DIRS) {
  const full = join(ROOT, d)
  if (statSync(full, { throwIfNoEntry: false })) walk(full, files)
}

const findings = []
for (const file of files) {
  const content = readFileSync(file, 'utf8')
  for (const { name, re } of PATTERNS) {
    re.lastIndex = 0
    if (re.test(content)) {
      findings.push({ file: file.replace(ROOT + '/', ''), pattern: name })
    }
  }
}

if (findings.length) {
  console.error('[secret-scan] Potential secrets committed to source:')
  for (const f of findings) console.error(`  - ${f.file} (${f.pattern})`)
  process.exit(1)
}

console.log(`[secret-scan] clean (${files.length} files scanned)`)
