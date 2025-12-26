const fs = require('fs');
const path = require('path');

const pool = require('../src/config/db');

(async () => {
  try {
    console.log('Running migrations...');

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      const sql = fs.readFileSync(
        path.join(migrationsDir, file),
        'utf8'
      );
      console.log(`Executing ${file}`);
      await pool.query(sql);
    }

    console.log('Migrations completed');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();