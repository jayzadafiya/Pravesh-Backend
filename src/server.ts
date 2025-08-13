import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import router from "./routers/v1.router";
import globalErrorHandler from "./middleware/error-handler.middleware";
import connectDB from "./config/db.config";
import "./cron/pingJob";
import { Server } from "http";

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

    app.use(
      cors({
        origin: function (origin, callback) {
          const allowedOrigins = [
            "http://localhost:5173",
            "http://localhost:3001",
            "http://localhost:5174",
            "https://pravesh.events",
            "https://praveshnavratri.netlify.app",
            "https://praveshevent.netlify.app",
            "https://praveshadmin.netlify.app",
            /\.pravesh\.events$/,
            /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
            "https://pravesh.events",
          ];

          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        credentials: true,
      })
    );

    app.use(express.json());

    app.use("/api/v1", router);

    app.use(
      (
        err: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        globalErrorHandler(err, req, res, next);
      }
    );

    const PORT = process.env.PORT || 3000;
    currentServer = app.listen(PORT, () => {
      console.log(`✅ Server is running successfully on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
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

  // Close current server and restart
  if (currentServer) {
    currentServer.close(() => {
      autoRestart();
    });
  } else {
    autoRestart();
  }
});
