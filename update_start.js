const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts.build = "prisma generate && prisma db push --accept-data-loss && next build";
pkg.scripts.start = "next start";
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('Updated package.json');
console.log(JSON.stringify(pkg.scripts, null, 2));
