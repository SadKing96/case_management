import { Router } from 'express';
import { prisma } from '../db/prisma';
import { requireAdmin, requireSuperUser } from '../middleware/auth';

const router = Router();

// GET /users - Fetch all users (Admin/SuperUser only)
router.get('/', requireAdmin, async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                roles: true,
                isActive: true,
                manager: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                teams: {
                    include: {
                        team: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
        const usersWithRoles = users.map(u => ({ ...u, roles: u.roles.split(',') }));
        res.json(usersWithRoles);
    } catch (error) {
        next(error);
    }
});

// POST /users - Create a new user (Admin only)
// POST /users - Create a new user (Admin only)
router.post('/', requireAdmin, async (req, res, next) => {
    try {
        const { name, email, password, role, managerId } = req.body;

        const user = await prisma.user.create({
            data: {
                name,
                email,
                roles: role ? role : 'User', // Default to User
                managerId: managerId || null
            },
            include: {
                manager: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        // Ensure roles string is converted to array if needed (though backend stores string, frontend expects array?)
        // The GET route splits it. We should probably accept array and join, or handle consistency.
        // For now, matching GET behavior implies we might need to format it, but prisma object returns exactly what's in DB.
        // GET route does: const usersWithRoles = users.map(u => ({ ...u, roles: u.roles.split(',') }));
        // We should replicate that consistency.
        const userWithRoles = { ...user, roles: user.roles.split(',') };

        res.status(201).json(userWithRoles);
    } catch (error) {
        next(error);
    }
});

// PATCH /users/:id/deactivate - Deactivate user (SuperUser only)
router.patch('/:id/deactivate', requireSuperUser, async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.update({
            where: { id },
            data: { isActive: false },
            select: { id: true, isActive: true }
        });
        res.json(user);
    } catch (error) {
        next(error);
    }
});

// PATCH /users/:id/activate - Activate user (SuperUser only)
router.patch('/:id/activate', requireSuperUser, async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.update({
            where: { id },
            data: { isActive: true },
            select: { id: true, isActive: true }
        });
        res.json(user);
    } catch (error) {
        next(error);
    }
});

// PUT /users/:id - Update user details (Admin only)
router.put('/:id', requireAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, role, managerId } = req.body; // Password update optional/omitted for now

        const updateData: any = {
            name,
            email,
            roles: role ? role : undefined,
            managerId: managerId || null
        };

        // Remove undefined keys
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            include: {
                manager: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        const userWithRoles = { ...user, roles: user.roles.split(',') };
        res.json(userWithRoles);
    } catch (error) {
        next(error);
    }
});

// DELETE /users/:id - Delete user (SuperUser only)
router.delete('/:id', requireSuperUser, async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({
            where: { id }
        });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export default router;
