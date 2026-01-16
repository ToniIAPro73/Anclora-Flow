import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve database connection settings with sensible defaults for Docker Compose
const dbHost = process.env.DB_HOST || process.env.POSTGRES_HOST || 'postgres';
const dbPort = Number(process.env.DB_PORT || process.env.POSTGRES_PORT || 5432);
const dbUser = process.env.DB_USER || process.env.POSTGRES_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'postgres';
const dbName = process.env.DB_NAME || process.env.POSTGRES_DB || 'anclora_flow';

// PostgreSQL connection pool configuration
export const pool = new Pool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err: Error) => {
  console.error('❌ Error inesperado en el cliente de PostgreSQL:', err);
  process.exit(-1);
});

// Query helper with error handling
export const query = async (text: string, params?: any[]) => {
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
export const transaction = async <T>(callback: (client: any) => Promise<T>): Promise<T> => {
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
export const initializeDatabase = async () => {
  try {
    // Assuming init.sql is in the same directory
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

// Seed database with synthetic data
export const seedDatabase = async () => {
  try {
    console.log('\n========================================');
    console.log('🌱 INICIANDO CARGA DE DATOS SINTÉTICOS');
    console.log('========================================\n');
    
    const sqlPath = path.join(__dirname, 'seed-data.sql');
    if (!fs.existsSync(sqlPath)) {
      console.warn('⚠️ No se encontró seed-data.sql, omitiendo carga de datos sintéticos.');
      return;
    }
    
    console.log(`📁 Archivo SQL encontrado: ${sqlPath}`);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`📝 Script SQL leído (${sql.length} caracteres)`);

    console.log('🔄 Ejecutando script de seed...');
    const result = await query(sql);
    
    console.log('\n========================================');
    console.log('✅ DATOS SINTÉTICOS CARGADOS CORRECTAMENTE');
    console.log('========================================\n');
    
    return result;
  } catch (error) {
    console.error('\n========================================');
    console.error('❌ ERROR AL CARGAR DATOS SINTÉTICOS');
    console.error('========================================');
    console.error('Detalles del error:', error);
    console.error('========================================\n');
    
    // Throw the error so we can see it in the server startup
    throw error;
  }
};

// Graceful shutdown
export const closePool = async () => {
  try {
    await pool.end();
    console.log('👋 Pool de conexiones cerrado');
  } catch (error) {
    console.error('❌ Error al cerrar el pool:', error);
  }
};
