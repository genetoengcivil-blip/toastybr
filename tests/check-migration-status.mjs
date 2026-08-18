import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const URL = process.env.TEST_SUPABASE_URL
const ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY
if (!URL || !ANON_KEY) {
  console.error('TEST_SUPABASE_URL and TEST_SUPABASE_ANON_KEY must be set (see .env.test.example)')
  process.exit(1)
}

const supabase = createClient(URL, ANON_KEY)

// Read migration SQL
const sqlPath = resolve(import.meta.dirname, '../supabase/migrations/20260818000000_staff_settings.sql')
const sql = readFileSync(sqlPath, 'utf-8')

// Split into individual statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))

console.log(`Migration has ${statements.length} statements`)
console.log('Note: Tables already exist. Need to apply RPCs and grants.')
console.log('SQL must be executed via Supabase Dashboard SQL Editor.')
console.log('')
console.log('Alternatively, the tables show up in test 1 but PostgREST cache is stale.')
console.log('The RPCs exist (test 11 passes). Schema cache reload needed.')
