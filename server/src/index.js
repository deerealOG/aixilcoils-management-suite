/**
 * AIXILCOILS Management Suite - Main Server Entry Point
 *
 * This is the main entry point for the AMS backend server.
 * It initializes Express, WebSocket, and connects to the database.
 */

require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const { initializeWebSocket } = require("./websocket/socketServer");
const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");

// Import Routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const departmentRoutes = require("./routes/department.routes");
const projectRoutes = require("./routes/project.routes");
const taskRoutes = require("./routes/task.routes");
const performanceRoutes = require("./routes/performance.routes");
const kpiRoutes = require("./routes/kpi.routes");
const okrRoutes = require("./routes/okr.routes");
const leaveRoutes = require("./routes/leave.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const documentRoutes = require("./routes/document.routes");
const workflowRoutes = require("./routes/workflow.routes");
const notificationRoutes = require("./routes/notification.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const onboardingRoutes = require("./routes/onboarding.routes");
const searchRoutes = require("./routes/search.routes");
const quickActionRoutes = require("./routes/quickactions.routes");
const favoritesRoutes = require("./routes/favorites.routes");
const timetrackingRoutes = require("./routes/timetracking.routes");

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Prisma 7 with PostgreSQL driver adapter
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
});

// Make prisma available globally
global.prisma = prisma;

// Initialize WebSocket (kept for real-time notifications)
initializeWebSocket(server);

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration
const corsOrigin = process.env.CLIENT_URL === '*' ? true : (process.env.CLIENT_URL || 'http://localhost:3000');
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files for uploads
app.use("/uploads", express.static("uploads"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    service: "AIXILCOILS Management Suite API",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/kpis", kpiRoutes);
app.use("/api/okrs", okrRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/expenses", require("./routes/expense.routes"));
app.use("/api/channels", require("./routes/channel.routes"));
app.use("/api/messages", require("./routes/message.routes"));
app.use("/api/documents", documentRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/quick", quickActionRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/timetracking", timetrackingRoutes);
app.use("/api/audit", require("./routes/audit.routes"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info("✅ Database connected successfully");

    server.listen(PORT, () => {
      logger.info(`🚀 AIXILCOILS Management Suite API running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  await prisma.$disconnect();
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully...");
  await prisma.$disconnect();
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

startServer();

module.exports = { app, prisma };
