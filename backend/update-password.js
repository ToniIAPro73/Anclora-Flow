import bcrypt from 'bcrypt';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  port: 5452,
  database: 'anclora_flow',
  user: 'postgres',
  password: 'anclora25%'
});

async function updatePassword() {
  try {
    const password = '123456';
    const hash = await bcrypt.hash(password, 10);
    
    console.log('Generated hash:', hash);
    console.log('Testing hash...');
    const testResult = await bcrypt.compare(password, hash);
    console.log('Test result:', testResult);
    
    // Update database
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING email, password_hash',
      [hash, 'demo@anclora.test']
    );
    
    console.log('Update result:', result.rows[0]);
    
    // Verify it was saved correctly
    const verify = await pool.query(
      'SELECT email, password_hash FROM users WHERE email = $1',
      ['demo@anclora.test']
    );
    
    console.log('Verification from DB:', verify.rows[0]);
    
    // Test the hash from DB
    const dbHash = verify.rows[0].password_hash;
    const finalTest = await bcrypt.compare(password, dbHash);
    console.log('Final test with DB hash:', finalTest);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

updatePassword();
