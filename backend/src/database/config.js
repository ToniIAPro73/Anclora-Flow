const { Pool } = require('pg');
require('dotenv').config();

// Resolve database connection settings with sensible defaults for Docker Compose
const dbHost = process.env.DB_HOST || process.env.POSTGRES_HOST || 'postgres';
const dbPort = Number(process.env.DB_PORT || process.env.POSTGRES_PORT || 5432);
const dbUser = process.env.DB_USER || process.env.POSTGRES_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'postgres';
const dbName = process.env.DB_NAME || process.env.POSTGRES_DB || 'anclora_flow';

// PostgreSQL connection pool configuration
const pool = new Pool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el cliente de PostgreSQL:', err);
  process.exit(-1);
});

// Query helper with error handling
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query ejecutado', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Error en query:', error);
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Initialize database with schema
const initializeDatabase = async () => {
  const fs = require('fs');
  const path = require('path');

  try {
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🔄 Inicializando base de datos con configuración:', {
      host: dbHost,
      port: dbPort,
      database: dbName,
      user: dbUser,
    });
    await query(sql);
    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  }
};

// Graceful shutdown
const closePool = async () => {
  try {
    await pool.end();
    console.log('👋 Pool de conexiones cerrado');
  } catch (error) {
    console.error('❌ Error al cerrar el pool:', error);
  }
};

module.exports = {
  pool,
  query,
  transaction,
  initializeDatabase,
  closePool
};
