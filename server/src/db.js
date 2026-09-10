import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10
});

function convertPlaceholders(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

export async function query(sql, params = []) {
  let text = convertPlaceholders(sql);
  if (/^\s*INSERT\s+INTO\s/i.test(text) && !/\bRETURNING\b/i.test(text)) text += ' RETURNING id';
  const result = await pool.query(text, params);
  const rows = result.rows || [];
  if (/^\s*INSERT\s+INTO\s/i.test(text)) return [{ insertId: rows[0]?.id }, rows];
  return [rows, result];
}

export { pool };
