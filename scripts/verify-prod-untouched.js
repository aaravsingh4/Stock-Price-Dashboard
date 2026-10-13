import pg from 'pg';
import { execSync } from 'child_process';

const { Pool } = pg;

async function verifyProductionClean() {
  const prodCs = execSync('neon connection-string production', { encoding: 'utf8' }).trim();
  const pool = new Pool({ connectionString: prodCs });
  try {
    const res = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
    );
    console.log('✅ Tables on PRODUCTION branch:');
    console.log(res.rows.map(r => r.table_name));
    if (res.rows.length === 0) {
      console.log('🛡️ Verified: Production branch public schema has 0 application tables (completely untouched)!');
    }
  } catch (err) {
    console.error('Error verifying production:', err);
  } finally {
    await pool.end();
  }
}

verifyProductionClean();
