import { query } from '../config.js';

async function checkTables() {
  console.log('🔍 Checking database tables...\n');

  try {
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('payments', 'receipts', 'bank_accounts', 'invoices', 'expenses')
      ORDER BY table_name
    `);

    console.log('Existing tables:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    console.log('');

    // Check if new tables exist
    const newTableNames = ['payments', 'receipts', 'bank_accounts'];
    const existingTables = result.rows.map((r: any) => r.table_name);
    
    const missingTables = newTableNames.filter(t => !existingTables.includes(t));

    if (missingTables.length > 0) {
      console.log('❌ Missing tables (need migration):');
      missingTables.forEach(t => console.log(`  - ${t}`));
    } else {
      console.log('✅ All required tables exist!');
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error checking tables:');
    console.error(error.message);
    process.exit(1);
  }
}

checkTables();
