import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRoutes from './routes';
import { errorHandler } from './middleware/error';
import { AppError } from './utils/AppError';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static('uploads'));

// Main API Router
app.use('/api/v1', apiRoutes);

// 404 Handler
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

export default app;
