import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5452'),
  database: process.env.DB_NAME || 'anclora_flow',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'anclora25%',
});

const targetEmail = 'pmi140979@gmail.com';

async function fixOwnership() {
  const client = await pool.connect();
  try {
    console.log(`Buscando usuario: ${targetEmail}...`);
    const userRes = await client.query('SELECT id FROM users WHERE email = $1', [targetEmail]);
    
    if (userRes.rows.length === 0) {
      console.log(`Error: No se encontró el usuario ${targetEmail}.`);
      return;
    }
    
    const newUserId = userRes.rows[0].id;
    console.log(`Usuario encontrado con ID: ${newUserId}`);
    
    const firstUserRes = await client.query('SELECT id FROM users LIMIT 1');
    const oldUserId = firstUserRes.rows[0].id;
    
    if (oldUserId === newUserId) {
      console.log('El usuario ya es el propietario del primer registro de usuario.');
      // Aún así, vamos a forzar la actualización de tablas por si acaso el seed se ejecutó con otro usuario
    }
    
    console.log(`Transfiriendo datos a ${targetEmail}...`);
    
    const tables = ['clients', 'projects', 'invoices', 'bank_accounts', 'expenses', 'budgets', 'subscriptions'];
    for (const table of tables) {
      const res = await client.query(`UPDATE ${table} SET user_id = $1 WHERE user_id != $1`, [newUserId]);
      console.log(`- Tabla ${table}: ${res.rowCount} filas actualizadas.`);
    }
    
    console.log('\n✅ Proceso completado con éxito.');
  } catch (err) {
    console.error('Error durante la actualización:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

fixOwnership().catch(console.error);
