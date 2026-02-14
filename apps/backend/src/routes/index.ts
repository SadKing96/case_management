import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import boardsRouter from './boards';
import casesRouter from './cases';
import usersRouter from './users';
import ingressRouter from './ingress';
import webhooksRouter from './webhooks';
import { getHealth } from '../controllers/health.controller';

const router = Router();

// Health Check
router.get('/health', getHealth);

// Public webhook
router.use('/webhooks', webhooksRouter);

// Public intake (rate limited in future)
router.post('/public/cases', (req, res) => {
    res.status(501).json({ message: 'Not implemented' });
});

import authRouter from './auth';
router.use('/auth', authRouter);

// Protected Routes
router.use(requireAuth);

router.get('/me', (req, res) => {
    // Configured by auth middleware
    res.json({ user: req.user });
});

import adminRouter from './admin';
import teamRoutes from './teams';
import garticaRoutes from './gartica'; // Added import for garticaRoutes

import projectsRouter from './projects';
import configRouter from './config';

router.use('/boards', boardsRouter);
router.use('/cases', casesRouter);
router.use('/users', usersRouter);
router.use('/admin', adminRouter);
router.use('/ingress', ingressRouter);
router.use('/teams', teamRoutes);
router.use('/projects', projectsRouter);
console.log("Registering Gartica Routes at /gartica");
router.use('/gartica', garticaRoutes); // Registered gartica routes
router.use('/config', configRouter);
// router.use('/rules', rulesRouter);

export default router;
