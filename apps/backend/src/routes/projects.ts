import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all projects
router.get('/', async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                items: true
            }
        });
        res.json(projects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Get single project
router.get('/:id', async (req, res) => {
    try {
        const project = await prisma.project.findUnique({
            where: { id: req.params.id },
            include: {
                items: {
                    include: {
                        linkedCases: {
                            select: { id: true, title: true, priority: true } // Selecting basic case info
                        }
                    }
                }
            }
        });
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// Create Project
router.post('/', async (req, res) => {
    try {
        const { name, description, startDate, endDate, status } = req.body;
        const project = await prisma.project.create({
            data: {
                name,
                description,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                status: status || 'planning'
            }
        });
        res.json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Create Timeline Item
router.post('/:id/items', async (req, res) => {
    try {
        // const { projectId } = req.params;
        // Wait, route is /:id/items so req.params.id is projectId.
        // But express router might handle params differently if nested. 
        // Let's assume /projects/:id/items.
        const projectIdFromUrl = req.params.id;

        const { content, start, end, type, group } = req.body;

        const item = await prisma.timelineItem.create({
            data: {
                projectId: projectIdFromUrl,
                content,
                start: new Date(start),
                end: new Date(end),
                type: type || 'range',
                group
            }
        });
        res.json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create timeline item' });
    }
});

// Update Timeline Item
router.put('/items/:itemId', async (req, res) => {
    try {
        const { content, start, end, progress } = req.body;
        const item = await prisma.timelineItem.update({
            where: { id: req.params.itemId },
            data: {
                content,
                start: start ? new Date(start) : undefined,
                end: end ? new Date(end) : undefined,
                progress: progress !== undefined ? progress : undefined
            }
        });
        res.json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// Delete Timeline Item
router.delete('/items/:itemId', async (req, res) => {
    try {
        await prisma.timelineItem.delete({
            where: { id: req.params.itemId }
        });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});


// Link Card to Timeline Item
router.post('/items/:itemId/link-card', async (req, res) => {
    try {
        const { cardId } = req.body;

        // Update the Case to point to this item
        const updatedCase = await prisma.case.update({
            where: { id: cardId },
            data: { timelineItemId: req.params.itemId }
        });

        res.json(updatedCase);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to link card' });
    }
});

// Unlink Card
router.post('/items/unlink-card', async (req, res) => {
    try {
        const { cardId } = req.body;
        const updatedCase = await prisma.case.update({
            where: { id: cardId },
            data: { timelineItemId: null }
        });
        res.json(updatedCase);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to unlink card' });
    }
});

export default router;
