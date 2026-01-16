import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import passport from 'passport';
import { Server } from 'http';

import { initializeDatabase, seedDatabase, query, closePool } from './database/config.js';
import { ensureDevUser } from './utils/devUser.js';

// Import routes (assuming they will be converted or handled by esModuleInterop)
// For now, importing with .js extension as per NodeNext requirements
import authRoutes from './api/auth/routes.js';
import budgetsRoutes from './api/budgets/routes.js';
import clientsRoutes from './api/clients/routes.js';
import expensesRoutes from './api/expenses/routes.js';
import invoicesRoutes from './api/invoices/routes.js';
import projectsRoutes from './api/projects/routes.js';
import subscriptionsRoutes from './api/subscriptions/routes.js';
import verifactuRoutes from './api/verifactu/routes.js';

import './config/passport.js';

const PORT: number = Number(process.env.PORT || 8020);

const app = express();

const resolveAllowedOrigins = (): Set<string> => {
  const rawOrigins: string = process.env.CORS_ALLOWED_ORIGINS || '';
  const explicitOrigins: string[] = rawOrigins
    .split(',')
    .map((origin: string) => origin.trim())
    .filter(Boolean);

  if (explicitOrigins.length) {
    return new Set(explicitOrigins);
  }

  const defaults: string[] = [
    process.env.FRONTEND_URL,
    'http://localhost:3020',
    'http://127.0.0.1:3020',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ].filter((url): url is string => Boolean(url));

  return new Set(defaults);
};

const allowedOrigins: Set<string> = resolveAllowedOrigins();
const allowAllOrigins: boolean =
  process.env.CORS_ALLOW_ALL === 'true' ||
  allowedOrigins.has('*') ||
  (!allowedOrigins.size && process.env.NODE_ENV !== 'production');

const corsOptions: cors.CorsOptions = {
  origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
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

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Type-safe middleware registration
app.use('/api/auth', authRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/verifactu', verifactuRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

interface CustomError extends Error {
  status?: number;
}

app.use((err: CustomError, _req: Request, res: Response, _next: NextFunction) => {
  const status: number = err.status || 500;
  const payload = {
    error: status >= 500 ? 'Error interno del servidor' : err.message,
  };

  if (status >= 500) {
    console.error('❌ Error no controlado:', err);
  }

  res.status(status).json(payload);
});

async function bootstrap(): Promise<Server | null> {
  try {
    if (process.env.SKIP_DB_INIT !== 'true') {
      await initializeDatabase();
    }

    if (process.env.SKIP_DEV_USER !== 'true') {
      await ensureDevUser();
    }

    // Always seed in this environment for the demo
    if (process.env.SEED_DB === 'true' || process.env.NODE_ENV !== 'production') {
       await seedDatabase();
    }

    // 5. Start server
    const server: Server = app.listen(PORT, () => {
      console.log(`🚀 Backend listo en http://localhost:${PORT}`);
    });

    const handleShutdown = (signal: string): void => {
      console.log(`\n🔻 Señal recibida (${signal}). Cerrando servidor...`);
      server.close(async () => {
        await closePool();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

    return server;
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error);
    process.exit(1);
  }

  return null;
}

// In ESM, we check if the module is the main one using this pattern:
// if (import.meta.url === `file://${process.argv[1]}`) { ... }
// But since we are using ts-node/tsc, we can just call it or check require.main if polyfilled
// Alternatively:
bootstrap();

export default app;
