import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import router from "./routers/v1.router";
import globalErrorHandler from "./middleware/error-handler.middleware";
import connectDB from "./config/db.config";
import "./cron/pingJob";
connectDB();

const app = express();

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
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

const PORT = process.env.PORT;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on("uncaughtException", (err) => {
  console.log("uncaughtException! Shutting down....");
  console.log(err.name, err.message);
  process.exit(1);
});

process.on("unhandledRejection", (err: any) => {
  console.error("💥 UNHANDLED REJECTION! Shutting down...");

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

  server.close(() => {
    process.exit(1);
  });
});
