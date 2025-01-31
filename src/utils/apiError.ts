import { StatusCodes } from 'http-status-codes';

// Base class for API errors
export class ApiError extends Error {
  statusCode: number;
  success: boolean;
  rawErrors: string[] = [];

  constructor(statusCode: number, message: string, success: boolean = false, rawErrors?: string[]) {
    super(message);
    this.statusCode = statusCode;
    this.success = success;
    if (rawErrors) this.rawErrors = rawErrors;
    Error.captureStackTrace(this, this.constructor);
  }
}


// Error for when authentication fails
export class UnauthorizedError extends ApiError {
  constructor(message = 'Not authorized') {
    super(StatusCodes.UNAUTHORIZED, message);
  }
}
// Error for when a requested resource is not found
export class NotFoundError extends ApiError {
  constructor(path: string) {
    super(StatusCodes.NOT_FOUND, `The requested path ${path} not found!`);
  }
}

// Error for bad requests, usually when input validation fails
export class BadRequestError extends ApiError {
  constructor(message: string, errors?: string[], statusCode: number = StatusCodes.BAD_REQUEST) {
    super(statusCode, message, false, errors);
  }
}

// General application error used for various kinds of application-specific errors
export class ApplicationError extends ApiError {
  constructor(message: string, errors?: string[]) {
    super(StatusCodes.BAD_REQUEST, message, false, errors);
  }
}
