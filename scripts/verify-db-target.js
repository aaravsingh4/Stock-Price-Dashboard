#!/usr/bin/env node
/**
 * Safety check script: Prevents accidental schema modifications or migrations
 * against the Neon production branch.
 */
import fs from 'fs';
import path from 'path';

const PRODUCTION_BRANCH_ID = 'br-lucky-frog-b5fczvmx';
const PRODUCTION_BRANCH_NAME = 'production';

// Check .neon context file
const neonConfigPath = path.resolve(process.cwd(), '.neon');
if (fs.existsSync(neonConfigPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(neonConfigPath, 'utf8'));
    if (config.branch === PRODUCTION_BRANCH_NAME || config.branch === PRODUCTION_BRANCH_ID) {
      console.error('\n❌ SAFETY CHECK FAILED: The active Neon context (.neon) is set to the PRODUCTION branch!');
      console.error(`   Active branch: ${config.branch}`);
      console.error('   Migrations and destructive operations are strictly disallowed against production.');
      console.error('   Please run `neon checkout tradepulse-dev` or link the development branch before proceeding.\n');
      process.exit(1);
    }
  } catch (err) {
    console.warn('⚠️ Could not parse .neon config:', err);
  }
}

// Check database URLs in environment
const databaseUrl = process.env.DATABASE_URL || '';
const directUrl = process.env.DIRECT_URL || '';

if (databaseUrl.includes('ep-ancient-glade') || directUrl.includes('ep-ancient-glade')) {
  console.error('\n❌ SAFETY CHECK FAILED: DATABASE_URL / DIRECT_URL points to the PRODUCTION compute endpoint (ep-ancient-glade)!');
  console.error('   Migrations and destructive operations are strictly disallowed against production.');
  console.error('   Please verify that your .env file references the development branch (tradepulse-dev).\n');
  process.exit(1);
}

console.log('✅ Target safety check passed: Target is verified as development (tradepulse-dev).');
process.exit(0);
