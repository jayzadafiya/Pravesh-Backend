import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/exceptions";

const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  console.error("Error:", err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.statusCode,
      message: err.message,
    });
  }

  return res.status(500).json({
    status: 500,
    message: "Something went wrong on the server!",
  });
};

export default globalErrorHandler;
