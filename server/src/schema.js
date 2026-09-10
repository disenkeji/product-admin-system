import { pool } from './db.js';

export async function ensureSchema() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin','employee')),
        status INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id BIGSERIAL PRIMARY KEY,
        parent_id BIGINT NULL REFERENCES categories(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 3),
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);');
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id BIGSERIAL PRIMARY KEY,
        category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        model VARCHAR(100) NOT NULL,
        name VARCHAR(200) NOT NULL,
        image VARCHAR(500),
        price NUMERIC(12,2) NOT NULL DEFAULT 0,
        cost NUMERIC(12,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_products_model ON products(model);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);');
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id BIGINT,
        detail JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);');
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
