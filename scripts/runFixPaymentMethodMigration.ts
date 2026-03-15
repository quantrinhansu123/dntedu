/**
 * Script to display SQL for fixing contracts payment_method CHECK constraint
 * Run this SQL in Supabase SQL Editor
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migrationFile = join(__dirname, '..', 'supabase', 'migrations', '034_fix_contracts_payment_method_constraint.sql');

try {
  const sql = readFileSync(migrationFile, 'utf-8');
  console.log('='.repeat(80));
  console.log('SQL Migration: Fix contracts payment_method CHECK constraint');
  console.log('='.repeat(80));
  console.log('\n');
  console.log(sql);
  console.log('\n');
  console.log('='.repeat(80));
  console.log('INSTRUCTIONS:');
  console.log('='.repeat(80));
  console.log('1. Copy the SQL above');
  console.log('2. Go to Supabase Dashboard > SQL Editor');
  console.log('3. Paste and run the SQL');
  console.log('4. This will fix the CHECK constraint for payment_method');
  console.log('='.repeat(80));
} catch (error) {
  console.error('Error reading migration file:', error);
  process.exit(1);
}
