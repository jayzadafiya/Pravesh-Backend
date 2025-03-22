export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestException extends AppError {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

export class NotFoundException extends AppError {
  constructor(message = "Resource Not Found") {
    super(message, 404);
  }
}

export class UnauthorizedException extends AppError {
  constructor(message = "Unauthorized Access") {
    super(message, 401);
  }
}

export class ForbiddenException extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}
