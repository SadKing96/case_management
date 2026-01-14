import { Request, Response } from 'express';

export const getHealth = (req: Request, res: Response) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
};
