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

// ✅ BadRequestError Now Supports Both Strings & Arrays & Objects
export class BadRequestError extends ApiError {
  constructor(message: string | string[] | object[], errors?: string[], statusCode: number = StatusCodes.BAD_REQUEST) {
    let formattedMessage: string;

    if (Array.isArray(message)) {
      if (typeof message[0] === 'object') {
        // ✅ Convert array of objects into readable strings
        formattedMessage = message
          .map(obj => Object.values(obj).join(' - ')) // Convert objects to readable strings
          .join('\n'); // New line separated format
      } else {
        // ✅ Join string array with new lines
        formattedMessage = message.join('\n');
      }
    } else if (typeof message === 'object') {
      // ✅ Handle single object case
      formattedMessage = Object.values(message).join(' - ');
    } else {
      formattedMessage = message;
    }

    super(statusCode, formattedMessage, false, errors);
  }
}


// General application error used for various kinds of application-specific errors
export class ApplicationError extends ApiError {
  constructor(message: string, errors?: string[]) {
    super(StatusCodes.BAD_REQUEST, message, false, errors);
  }
}
