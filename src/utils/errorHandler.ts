import { Request, Response, NextFunction } from 'express';
import { ApiError } from './apiError';

export default class ErrorHandler {
  static handle = () => {
    return async (err: ApiError, req: Request, res: Response, next: NextFunction) => {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).send({
        success: false,
        message: err.message,
        rawErrors: err.rawErrors ?? [],
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      });
    };
  };

  static initializeUnhandledException = () => {
    process.on('unhandledRejection', (reason: Error, promise: Promise<any>) => {
      console.warn(reason.name, reason.message);
      console.warn('UNHANDLED REJECTION! 💥 Shutting down...');
      throw reason;
    });

    process.on('uncaughtException', (err: Error) => {
      console.warn(err.name, err.message);
      console.warn('UNCAUGHT EXCEPTION! 💥 Shutting down...');
      process.exit(1);
    });
  };
}
