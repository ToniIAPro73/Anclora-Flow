import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const migrationFile = path.join(__dirname, '003_add_payments_receipts_bank_accounts.sql');
  
  console.log('🔄 Running migration: 003_add_payments_receipts_bank_accounts.sql');
  console.log('');

  try {
    // Read the SQL file
    const sql = await fs.readFile(migrationFile, 'utf-8');
    
    console.log('📄 Migration SQL loaded');
    console.log('🗄️  Executing migration...');
    console.log('');

    // Execute the migration
    await query(sql);

    console.log('✅ Migration completed successfully!');
    console.log('');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('payments', 'receipts', 'bank_accounts')
      ORDER BY table_name
    `);

    console.log('');
    console.log('Tables created:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    console.log('');
    console.log('✅ Migration verification complete!');
    process.exit(0);

  } catch (error: any) {
    console.error('');
    console.error('❌ Migration failed:');
    console.error(error.message);
    console.error('');
    if (error.detail) {
      console.error('Detail:', error.detail);
    }
    if (error.hint) {
      console.error('Hint:', error.hint);
    }
    process.exit(1);
  }
}

runMigration();
