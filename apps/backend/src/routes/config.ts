import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get config (published for public/client, draft for admin)
// Routes in index.ts are already under requireAuth? No, index.ts has router.use(requireAuth) before mounting others.
// So redundancy is fine, or I can remove it if I trust index.ts structure. 
// But index.ts structure shows:
// router.use(requireAuth);
// ...
// router.use('/config', configRouter);
// So requireAuth is ALREADY applied.
// However, I want to use requireAdmin for specific routes.

router.get('/:key', async (req: any, res) => {
    const { key } = req.params;
    // ... rest of implementation ...
    try {
        // ...
        const config = await prisma.dashboardConfig.findUnique({
            where: { key }
        });

        if (!config) {
            return res.json({ key, draft: '{}', published: '{}' });
        }
        return res.json(config);
    } catch (error) {
        console.error('Failed to fetch config', error);
        res.status(500).json({ error: 'Failed to fetch config' });
    }
});

// Update draft (Admin only)
router.put('/:key', requireAdmin, async (req: any, res) => {
    const { key } = req.params;
    const { draft } = req.body;

    if (!draft) {
        return res.status(400).json({ error: 'Draft content required' });
    }

    const draftStr = typeof draft === 'string' ? draft : JSON.stringify(draft);

    try {
        const config = await prisma.dashboardConfig.upsert({
            where: { key },
            update: { draft: draftStr },
            create: {
                key,
                draft: draftStr,
                published: null
            }
        });
        res.json(config);
    } catch (error) {
        console.error('Failed to update draft', error);
        res.status(500).json({ error: 'Failed to update draft' });
    }
});

// Publish draft (Admin only)
router.post('/:key/publish', requireAdmin, async (req: any, res) => {
    const { key } = req.params;

    try {
        const current = await prisma.dashboardConfig.findUnique({ where: { key } });
        if (!current) {
            return res.status(404).json({ error: 'Config not found' });
        }

        const updated = await prisma.dashboardConfig.update({
            where: { key },
            data: {
                published: current.draft,
                publishedAt: new Date()
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Failed to publish', error);
        res.status(500).json({ error: 'Failed to publish' });
    }
});

export default router;
