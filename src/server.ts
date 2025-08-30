import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
const xss = require("xss-clean");
import hpp from "hpp";
import cookieParser from "cookie-parser";
import compression from "compression";
import router from "./routers/v1.router";
import globalErrorHandler from "./middleware/error-handler.middleware";
import connectDB from "./config/db.config";
import "./cron/pingJob";
import { Server } from "http";
import {
  securityConfig,
  createRateLimiter,
  getTrustedProxies,
  addSecurityHeaders,
} from "./config/security.config";
import {
  validateIPAddress,
  validateRequestSize,
  botProtection,
  advancedRequestValidation,
  requestTimingAnalysis,
  securityAuditLogger,
} from "./middleware/security.middleware";

// Extend Express Request interface for custom properties
declare global {
  namespace Express {
    interface Request {
      id?: string;
      rawBody?: Buffer;
    }
  }
}

// Auto-restart configuration
const MAX_RESTART_ATTEMPTS = 5;
let restartCount = 0;
const RESTART_DELAY = 5000; // 5 seconds
let currentServer: Server | null = null;

async function startServer() {
  try {
    console.log(`🚀 Starting server... (Attempt ${restartCount + 1})`);

    await connectDB();

    const app = express();

    // Security: Trust proxy for accurate IP addresses behind reverse proxy
    // app.set("trust proxy", getTrustedProxies());

    // Security: Helmet for setting various HTTP headers
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: securityConfig.csp.directives,
        },
        crossOriginEmbedderPolicy: false, // Disable if needed for external resources
      })
    );


    // Security: Data sanitization against NoSQL query injection
    app.use(mongoSanitize());

    // Security: Data sanitization against XSS attacks
    app.use(xss());

    // Security: Prevent HTTP Parameter Pollution attacks
    app.use(
      hpp({
        whitelist: securityConfig.hppWhitelist,
     })
    );

    // Security: Cookie parser with secure options
    app.use(cookieParser());

    // Performance: Compression middleware
    app.use(
      compression({
        level: 6,
        threshold: 1024,
        filter: (req, res) => {
          if (req.headers["x-no-compression"]) {
            return false;
          }
          return compression.filter(req, res);
        },
      })
    );

    // Security: Body parsing with size limits
    app.use(
      express.json({
        limit: securityConfig.bodyLimits.json,
        verify: (req: any, res, buf) => {
          req.rawBody = buf;
        },
      })
    );

    app.use(
      express.urlencoded({
        extended: true,
        limit: securityConfig.bodyLimits.urlencoded,
      })
    );

    // Security: Enhanced CORS configuration
    app.use(
      cors({
        origin: function (origin, callback) {
          // Allow requests with no origin (mobile apps, curl, etc.)
          if (!origin) return callback(null, true);

          // Check if origin is in allowed list or matches regex patterns
          const isAllowed = securityConfig.cors.allowedOrigins.some(
            (allowedOrigin) => {
              if (typeof allowedOrigin === "string") {
                return allowedOrigin === origin;
              }
              return allowedOrigin.test(origin);
            }
          );

          if (isAllowed) {
            callback(null, true);
          } else {
            console.warn(`🚫 CORS blocked origin: ${origin}`);
            callback(new Error("Not allowed by CORS"));
          }
        },
        credentials: true,
        methods: securityConfig.cors.methods,
        allowedHeaders: securityConfig.cors.allowedHeaders,
        exposedHeaders: ["set-cookie"],
        maxAge: 86400, // 24 hours
      })
    );

    // Security: Hide server information
    app.disable("x-powered-by");

    // Security: Add custom security headers
    app.use(addSecurityHeaders);

    // Security: IP address validation
    app.use(validateIPAddress);

    // Security: Request size validation
    app.use(validateRequestSize);

    // Security: Bot protection
    app.use(botProtection);

    // Security: Advanced request validation
    app.use(advancedRequestValidation);

    // Security: Request timing analysis
    app.use(requestTimingAnalysis);

    // Security: Audit logging for sensitive operations
    app.use(securityAuditLogger);

    // Security: Request logging and monitoring middleware
    app.use(
      (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        const start = Date.now();
        requestCount++; // Increment for monitoring

        // Security: Block suspicious user agents
        const userAgent = req.get("User-Agent") || "";
        const suspiciousAgents = [
          "sqlmap",
          "nikto",
          "nmap",
          "masscan",
          "zap",
          "burp",
          "acunetix",
          "nessus",
          "openvas",
          "w3af",
        ];

        if (
          suspiciousAgents.some((agent) =>
            userAgent.toLowerCase().includes(agent)
          )
        ) {
          console.warn(
            `🚨 Suspicious user agent blocked: ${userAgent} from ${req.ip}`
          );
          res.status(403).json({ error: "Forbidden" });
          return;
        }

        // Security: Block requests with suspicious headers
        const suspiciousHeaders = ["x-forwarded-host", "x-real-ip"];
        for (const header of suspiciousHeaders) {
          if (req.get(header) && !process.env.ALLOW_PROXY_HEADERS) {
            console.warn(
              `🚨 Suspicious header detected: ${header} from ${req.ip}`
            );
            res.status(403).json({ error: "Forbidden" });
            return;
          }
        }

        res.on("finish", () => {
          const duration = Date.now() - start;
          const logData = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get("User-Agent"),
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            requestId: req.id,
            contentLength: res.get("Content-Length") || "0",
          };

          // Log suspicious activities
          if (res.statusCode >= 400) {
            console.warn("🚨 Suspicious request:", logData);
          }

          // Log slow requests
          if (duration > securityConfig.monitoring.slowRequestThreshold) {
            console.warn("🐌 Slow request detected:", logData);
          }

          // Security: Detect potential attacks
          if (
            req.url.includes("../") ||
            req.url.includes("..\\") ||
            req.url.includes("%2e%2e") ||
            req.url.includes("javascript:") ||
            req.url.includes("<script>")
          ) {
            console.error("🚨 Path traversal/XSS attempt detected:", logData);
          }
        });

        next();
      }
    );

    // Security: Content validation middleware
    app.use(
      (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        // Check for SQL injection patterns in request body
        const checkForSQLInjection = (obj: any): boolean => {
          if (typeof obj === "string") {
            const sqlPatterns = [
              /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
              /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
              /(--|\||#)/,
              /(\b(WAITFOR|DELAY)\b)/i,
            ];
            return sqlPatterns.some((pattern) => pattern.test(obj));
          }

          if (typeof obj === "object" && obj !== null) {
            return Object.values(obj).some((value) =>
              checkForSQLInjection(value)
            );
          }

          return false;
        };

        if (req.body && checkForSQLInjection(req.body)) {
          console.error(
            `🚨 SQL injection attempt detected from ${req.ip}:`,
            req.body
          );
          res.status(400).json({ error: "Invalid request data" });
          return;
        }

        next();
      }
    );

    // Health check endpoint (before authentication)
    app.get("/health", (req, res) => {
      res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.MAIN_ENVIRONMENT || "development",
        version: process.env.npm_package_version || "1.0.0",
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      });
    });

    // Security endpoint for monitoring
    app.get(
      "/api/v1/security/status",
      (req: express.Request, res: express.Response) => {
        // Only allow in development or with proper authentication
        if (
          process.env.MAIN_ENVIRONMENT === "production" &&
          !req.headers.authorization
        ) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }

        res.status(200).json({
          security: {
            rateLimiting: "enabled",
            cors: "configured",
            helmet: "enabled",
            dataValidation: "enabled",
            requestLogging: "enabled",
          },
          monitoring: {
            requestCount: requestCount,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
          },
        });
      }
    );

    // Main API routes
    app.use("/api/v1", router);

    // Security: Handle 404 errors
    app.use("*", (req, res) => {
      console.warn(
        `🚨 404 attempt: ${req.method} ${req.originalUrl} from ${req.ip}`
      );
      res.status(404).json({
        error: "Route not found",
        message: "The requested resource does not exist",
        timestamp: new Date().toISOString(),
      });
    });

    // Security: Enhanced global error handler
    app.use(
      (
        err: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        // Log security-related errors
        if (
          err.message.includes("CORS") ||
          err.message.includes("rate limit") ||
          err.message.includes("validation") ||
          err.message.includes("Forbidden")
        ) {
          console.error("🛡️ Security error:", {
            error: err.message,
            ip: req.ip,
            userAgent: req.get("User-Agent"),
            url: req.url,
            method: req.method,
            timestamp: new Date().toISOString(),
            stack:
              process.env.MAIN_ENVIRONMENT === "development"
                ? err.stack
                : undefined,
          });
        }

        globalErrorHandler(err, req, res, next);
      }
    );

    const PORT = process.env.PORT || 3000;
    currentServer = app.listen(PORT, () => {
      console.log(`✅ Server is running successfully on port ${PORT}`);
      console.log(
        `🌍 Environment: ${process.env.MAIN_ENVIRONMENT || "development"}`
      );
      restartCount = 0; // Reset restart count on successful start
    });

    // Handle server errors
    currentServer.on("error", (error: any) => {
      console.error("❌ Server error:", error.message);
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use`);
      }
      autoRestart();
    });

    return currentServer;
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    throw error;
  }
}

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  console.log(`\n📴 Received ${signal}. Graceful shutdown initiated...`);
  if (currentServer) {
    currentServer.close((err) => {
      console.log("🔄 HTTP server closed.");

      if (err) {
        console.error("❌ Error during server shutdown:", err);
        process.exit(1);
      }

      console.log("✅ Graceful shutdown completed.");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

// Auto-restart function
async function autoRestart() {
  if (restartCount >= MAX_RESTART_ATTEMPTS) {
    console.error(
      `❌ Maximum restart attempts (${MAX_RESTART_ATTEMPTS}) reached. Exiting...`
    );
    process.exit(1);
  }

  restartCount++;
  console.log(
    `🔄 Auto-restarting server in ${
      RESTART_DELAY / 1000
    } seconds... (Attempt ${restartCount}/${MAX_RESTART_ATTEMPTS})`
  );

  // Close current server if it exists
  if (currentServer) {
    currentServer.close();
    currentServer = null;
  }

  setTimeout(() => {
    startServer().catch((error) => {
      console.error("❌ Server restart failed:", error);
      autoRestart();
    });
  }, RESTART_DELAY);
}

// Start the server initially
startServer().catch((error) => {
  console.error("❌ Initial server start failed:", error);
  autoRestart();
});

// Handle termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Enhanced error handling
process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION! Server will restart...");
  console.error("Name:", err.name);
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);

  // Log to external monitoring service if available
  if (process.env.MAIN_ENVIRONMENT === "production") {
    // TODO: Send to external logging service (e.g., Sentry, LogRocket)
    console.error("Production error logged to monitoring service");
  }

  // Close current server and restart
  if (currentServer) {
    currentServer.close(() => {
      autoRestart();
    });
  } else {
    autoRestart();
  }
});

process.on("unhandledRejection", (err: any) => {
  console.error("💥 UNHANDLED REJECTION! Server will restart...");

  if (err instanceof Error) {
    console.error("Name:", err.name);
    console.error("Message:", err.message);
    console.error("Stack Trace:\n", err.stack);

    const stackLines = err.stack?.split("\n");
    if (stackLines && stackLines.length > 1) {
      const fileInfo = stackLines[1].match(/\((.*):(\d+):(\d+)\)/);
      if (fileInfo) {
        console.error("File:", fileInfo[1]);
        console.error("Line:", fileInfo[2]);
        console.error("Column:", fileInfo[3]);
      }
    }
  } else {
    console.error("Non-Error rejection:", err);
  }

  // Log to external monitoring service if available
  if (process.env.MAIN_ENVIRONMENT === "production") {
    console.error("Production rejection logged to monitoring service");
  }

  // Close current server and restart
  if (currentServer) {
    currentServer.close(() => {
      autoRestart();
    });
  } else {
    autoRestart();
  }
});

// Security: Monitor memory usage and restart if needed
const MAX_MEMORY_USAGE = 512 * 1024 * 1024; // 512MB
setInterval(() => {
  const memUsage = process.memoryUsage();

  if (memUsage.heapUsed > MAX_MEMORY_USAGE) {
    console.warn(
      `🚨 High memory usage detected: ${Math.round(
        memUsage.heapUsed / 1024 / 1024
      )}MB`
    );

    if (global.gc) {
      global.gc();
      console.log("🧹 Garbage collection triggered");
    }
  }

  // Log memory usage every 10 minutes in production
  if (process.env.MAIN_ENVIRONMENT === "production") {
    console.log(
      `📊 Memory usage: ${Math.round(
        memUsage.heapUsed / 1024 / 1024
      )}MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
    );
  }
}, 10 * 60 * 1000); // Check every 10 minutes

// Security: Process monitoring for suspicious activity
let requestCount = 0;

setInterval(() => {
  if (requestCount > securityConfig.monitoring.requestThreshold) {
    console.warn(
      `🚨 High request volume detected: ${requestCount} requests in the last minute`
    );
    // TODO: Implement additional security measures or alerting
  }
  requestCount = 0; // Reset counter
}, securityConfig.monitoring.requestCountWindow);

// Security: Memory monitoring
setInterval(() => {
  const memUsage = process.memoryUsage();

  if (memUsage.heapUsed > securityConfig.monitoring.maxMemoryUsage) {
    console.warn(
      `🚨 High memory usage detected: ${Math.round(
        memUsage.heapUsed / 1024 / 1024
      )}MB`
    );

    if (global.gc) {
      global.gc();
      console.log("🧹 Garbage collection triggered");
    }
  }

  // Log memory usage in production
  if (process.env.MAIN_ENVIRONMENT === "production") {
    console.log(
      `📊 Memory usage: ${Math.round(
        memUsage.heapUsed / 1024 / 1024
      )}MB / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
    );
  }
}, securityConfig.monitoring.memoryCheckInterval);
