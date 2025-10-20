const fs = require('fs');
const path = require('path');
const database = require('../config/database');

async function setupWidgetSystem() {
  try {
    console.log('\n========================================');
    console.log('Widget System Setup');
    console.log('========================================\n');

    console.log('Step 1: Connecting to database...');
    await database.connect();
    console.log('✓ Database connected\n');

    console.log('Step 2: Running migration...');
    const migrationPath = path.join(__dirname, '../migrations/001_create_widget_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('/*') && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await database.query(statement);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`  ○ Skipping: ${error.message.split(':')[0]}`);
        } else {
          throw error;
        }
      }
    }

    console.log('✓ Migration completed\n');

    console.log('Step 3: Seeding widget types...');
    const seedWidgets = require('./seedWidgets');
    await seedWidgets();
    console.log('✓ Widget types seeded\n');

    console.log('========================================');
    console.log('Widget System Setup Complete!');
    console.log('========================================\n');

    console.log('Next steps:');
    console.log('1. Start your server: npm start');
    console.log('2. Import Postman collection: backend/postman/10_Widget_System.postman_collection.json');
    console.log('3. Read documentation: backend/WIDGET_SYSTEM_SETUP.md\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\nPlease check:');
    console.error('1. Database connection is configured in .env');
    console.error('2. PostgreSQL is running');
    console.error('3. User table exists (run main migrations first)\n');
    process.exit(1);
  }
}

setupWidgetSystem();
