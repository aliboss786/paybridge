const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');
const SCHEMA_PATH = path.join(__dirname, '..', 'prisma', 'schema.prisma');

function log(msg) {
  console.log(`[ensure-db] ${msg}`);
}

function seedAdmin() {
  try {
    const Database = require('better-sqlite3');
    const db = new Database(DB_PATH);

    const existing = db.prepare('SELECT id FROM admins LIMIT 1').get();
    if (existing) {
      log('Admin already exists, skipping seed');
      db.close();
      return;
    }

    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('Admin123!', 10);
    const id = 'admin_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO admins (id, email, name, password_hash, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, 'aliphotolab@gmail.com', 'Admin', hash, 'admin', now, now);

    log('Admin seeded: aliphotolab@gmail.com / Admin123!');
    db.close();
  } catch (e) {
    log('Seed skipped (better-sqlite3 not available): ' + e.message);
  }
}

try {
  log('Running prisma generate...');
  execSync('npx prisma generate', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

  log('Running prisma db push...');
  execSync('npx prisma db push --accept-data-loss', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

  log('Database ready!');
  seedAdmin();
} catch (e) {
  console.error('[ensure-db] Error:', e.message);
  process.exit(1);
}
