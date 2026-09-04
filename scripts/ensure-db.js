const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function log(msg) {
  console.log(`[ensure-db] ${msg}`);
}

try {
  log('Generating Prisma client...');
  execSync('npx prisma generate', { cwd: ROOT, stdio: 'inherit' });

  log('Pushing database schema...');
  execSync('npx prisma db push --accept-data-loss', { cwd: ROOT, stdio: 'inherit' });

  log('Database ready!');
} catch (e) {
  console.error('[ensure-db] Migration error:', e.message);
  process.exit(1);
}
