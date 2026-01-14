import { Request, Response, NextFunction } from 'express';

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;

const requests: Record<string, number[]> = {};

// Clean up old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const ip in requests) {
        requests[ip] = requests[ip].filter(time => now - time < WINDOW_MS);
        if (requests[ip].length === 0) {
            delete requests[ip];
        }
    }
}, WINDOW_MS);

export const rateLimit = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();

    if (!requests[ip]) {
        requests[ip] = [];
    }

    requests[ip] = requests[ip].filter(time => now - time < WINDOW_MS);

    if (requests[ip].length >= MAX_REQUESTS) {
        return res.status(429).json({
            error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' }
        });
    }

    requests[ip].push(now);
    next();
};
