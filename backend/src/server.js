require('dotenv').config();

const express = require('express');
const cors = require('cors');
const passport = require('passport');

const { initializeDatabase, closePool } = require('./database/config');
const { ensureDevUser } = require('./utils/devUser');

const authRoutes = require('./api/auth/routes');
const budgetsRoutes = require('./api/budgets/routes');
const clientsRoutes = require('./api/clients/routes');
const expensesRoutes = require('./api/expenses/routes');
const invoicesRoutes = require('./api/invoices/routes');
const projectsRoutes = require('./api/projects/routes');
const subscriptionsRoutes = require('./api/subscriptions/routes');
const verifactuRoutes = require('./api/verifactu/routes');

require('./config/passport');

const PORT = Number(process.env.PORT || 8020);

const app = express();

const resolveAllowedOrigins = () => {
  const rawOrigins = process.env.CORS_ALLOWED_ORIGINS || '';
  const explicitOrigins = rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (explicitOrigins.length) {
    return new Set(explicitOrigins);
  }

  const defaults = [
    process.env.FRONTEND_URL,
    'http://localhost:3020',
    'http://127.0.0.1:3020',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ].filter(Boolean);

  return new Set(defaults);
};

const allowedOrigins = resolveAllowedOrigins();
const allowAllOrigins =
  process.env.CORS_ALLOW_ALL === 'true' ||
  allowedOrigins.has('*') ||
  (!allowedOrigins.size && process.env.NODE_ENV !== 'production');

const corsOptions = {
  origin(origin, callback) {
    if (allowAllOrigins || !origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS: origen no permitido (${origin}). Actualiza CORS_ALLOWED_ORIGINS si es necesario.`);
    return callback(new Error('Origen no permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/verifactu', verifactuRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const payload = {
    error: status >= 500 ? 'Error interno del servidor' : err.message,
  };

  if (status >= 500) {
    console.error('❌ Error no controlado:', err);
  }

  res.status(status).json(payload);
});

async function bootstrap() {
  try {
    if (process.env.SKIP_DB_INIT !== 'true') {
      await initializeDatabase();
    }

    if (process.env.SKIP_DEV_USER !== 'true') {
      await ensureDevUser();
    }

    const server = app.listen(PORT, () => {
      console.log(`🚀 Backend listo en http://localhost:${PORT}`);
    });

    const handleShutdown = (signal) => {
      console.log(`\n🔻 Señal recibida (${signal}). Cerrando servidor...`);
      server.close(async () => {
        await closePool();
        process.exit(0);
      });
    };

    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);

    return server;
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error);
    process.exit(1);
  }

  return null;
}

if (require.main === module) {
  bootstrap();
}

module.exports = app;
