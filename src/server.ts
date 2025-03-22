import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import connectDB from "./config/db.config";
import router from "./routers/v1.router";
import globalErrorHandler from "./middleware/error-handler.middleware";

connectDB();

const app = express();

app.use(cors());
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
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
