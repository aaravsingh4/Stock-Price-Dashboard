import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

async function checkConnection() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  try {
    const res = await pool.query('SELECT 1 as connected, current_database() as db, current_user as usr, version() as ver;');
    console.log('✅ Connection test successful:');
    console.log({
      connected: res.rows[0].connected === 1,
      database: res.rows[0].db,
      user: res.rows[0].usr,
      version: res.rows[0].ver.split(' ')[0] + ' ' + res.rows[0].ver.split(' ')[1]
    });
  } catch (err) {
    console.error('❌ Connection test error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkConnection();
