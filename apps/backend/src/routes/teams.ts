
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Schema validation
const TeamSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    color: z.string().optional(),
    isActive: z.boolean().optional(),
    members: z.array(z.string()).optional(), // Array of user IDs
});

// GET / - List all teams
router.get('/', async (req, res) => {
    try {
        const teams = await prisma.team.findMany({
            include: {
                _count: {
                    select: { members: true }
                },
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(teams);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// POST / - Create a team
router.post('/', async (req, res) => {
    try {
        const { name, description, color, isActive, members } = TeamSchema.parse(req.body);

        const team = await prisma.team.create({
            data: {
                name,
                description,
                color: color || '#3b82f6',
                isActive: isActive ?? true,
                members: members && members.length > 0 ? {
                    create: members.map(userId => ({
                        userId
                    }))
                } : undefined
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }
            }
        });
        res.status(201).json(team);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Failed to create team' });
    }
});

// PUT /:id - Update a team
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, color, isActive } = TeamSchema.parse(req.body);
        const team = await prisma.team.update({
            where: { id },
            data: {
                name,
                description,
                color,
                isActive
            }
        });
        res.json(team);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Failed to update team' });
    }
});

// DELETE /:id - Delete a team
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.team.delete({
            where: { id }
        });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete team' });
    }
});

// POST /:id/members - Add user to team
router.post('/:id/members', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) return res.status(400).json({ error: 'userId is required' });

        const member = await prisma.teamMember.create({
            data: {
                teamId: id,
                userId
            },
            include: {
                user: { select: { id: true, name: true, email: true } }
            }
        });
        res.status(201).json(member);
    } catch (error) {
        console.error(error);
        // handle unique constraint violation cleanly?
        res.status(400).json({ error: 'Failed to add member or already exists' });
    }
});

// DELETE /:id/members/:userId - Remove user from team
router.delete('/:id/members/:userId', async (req, res) => {
    try {
        const { id, userId } = req.params;
        // We need to find the unique ID or deleteMany
        await prisma.teamMember.deleteMany({
            where: {
                teamId: id,
                userId: userId
            }
        });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

export default router;
