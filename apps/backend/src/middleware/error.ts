import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let error = err;

    if (error instanceof ZodError) {
        const message = 'Invalid request data';
        // You might want to format Zod errors better in a real app
        error = new AppError(message, 400);
    } else if (!(error instanceof AppError)) {
        const statusCode = (error as any).statusCode || 500;
        const message = error.message || 'Something went wrong';
        error = new AppError(message, statusCode);
    }

    const statusCode = (error as AppError).statusCode || 500;
    const status = (error as AppError).status || 'error';

    if (process.env.NODE_ENV === 'development') {
        res.status(statusCode).json({
            status: status,
            error: error,
            message: error.message,
            stack: error.stack,
        });
    } else {
        // Production: don't leak stack traces
        if ((error as AppError).isOperational) {
            res.status(statusCode).json({
                status: status,
                message: error.message,
            });
        } else {
            // Programming or other unknown error: don't leak details
            console.error('ERROR 💥', error);
            res.status(500).json({
                status: 'error',
                message: 'Something went very wrong!',
            });
        }
    }
};
