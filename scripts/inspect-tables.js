import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

async function inspectDevTables() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL });
  try {
    const res = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
    );
    console.log('✅ Tables created in tradepulse-dev:');
    console.log(res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Error inspecting tables:', err);
  } finally {
    await pool.end();
  }
}

inspectDevTables();
