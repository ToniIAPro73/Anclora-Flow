require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const { initializeDatabase, closePool } = require("./database/config");
const { ensureDevUser } = require("./utils/devUser");
require("./config/passport");

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 8020;

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3020',
    'http://localhost:5173',  // Vite dev server
    'http://localhost:3020',  // Frontend build
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Import routes
const authRoutes = require("./api/auth/routes");
const invoiceRoutes = require("./api/invoices/routes");
const expenseRoutes = require("./api/expenses/routes");
const clientRoutes = require("./api/clients/routes");
const projectRoutes = require("./api/projects/routes");
const verifactuRoutes = require("./api/verifactu/routes");

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Anclora Flow API está funcionando",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/verifactu", verifactuRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint no encontrado" });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Error interno del servidor",
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log("🔄 Iniciando Anclora Flow Backend...");

    // Initialize database
    await initializeDatabase();

    if (process.env.NODE_ENV !== 'production') {
      await ensureDevUser();
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 Backend escuchando en http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
      console.log(`📄 Invoices API: http://localhost:${PORT}/api/invoices`);
      console.log(`💰 Expenses API: http://localhost:${PORT}/api/expenses`);
      console.log(`👥 Clients API: http://localhost:${PORT}/api/clients`);
      console.log(`📁 Projects API: http://localhost:${PORT}/api/projects`);
      console.log(`✅ Verifactu API: http://localhost:${PORT}/api/verifactu\n`);
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("👋 SIGTERM recibido, cerrando servidor...");
  await closePool();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("👋 SIGINT recibido, cerrando servidor...");
  await closePool();
  process.exit(0);
});

startServer();
