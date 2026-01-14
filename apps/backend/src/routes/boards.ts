import { Router } from 'express';
import { prisma as prismaClient } from '../db/prisma';
const prisma = prismaClient as any;

const router = Router();

// GET /boards/mine - Get all boards checking user membership
router.get('/mine', async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: { code: 'UNAUTHORIZED' } });

        // If SuperUser or Admin, return all boards?
        // Logic: if SuperUser, show all. If normal user, show only assigned.
        const roles = user.roles || [];
        if (roles.includes('SuperUser') || roles.includes('Admin')) {
            const boards = await prisma.board.findMany({
                orderBy: { name: 'asc' }
            });
            return res.json(boards);
        }

        // Explicit User Membership
        const memberBoards = await prisma.boardMember.findMany({
            where: { userId: user.id },
            include: { board: true },
        });

        // Team Membership
        const teamMemberships = await prisma.teamMember.findMany({
            where: { userId: user.id },
            select: { teamId: true }
        });
        const teamIds = teamMemberships.map((tm: any) => tm.teamId);

        let teamBoards: any[] = [];
        if (teamIds.length > 0) {
            const boardTeams = await prisma.boardTeam.findMany({
                where: { teamId: { in: teamIds } },
                include: { board: true }
            });
            teamBoards = boardTeams.map((bt: any) => bt.board);
        }

        // Combine and dedup
        const allBoardsMap = new Map();
        memberBoards.forEach((mb: any) => allBoardsMap.set(mb.board.id, mb.board));
        teamBoards.forEach((b: any) => allBoardsMap.set(b.id, b));

        const allBoards = Array.from(allBoardsMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));

        res.json(allBoards);
    } catch (error) {
        next(error);
    }
});

// GET /boards/:boardId
router.get('/:boardId', async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const board = await prisma.board.findFirst({
            where: {
                OR: [
                    { id: boardId },
                    { slug: boardId }
                ]
            },
            include: {
                columns: {
                    orderBy: { position: 'asc' },
                    include: {
                        cases: {
                            where: {
                                archivedAt: null,
                                deletedAt: null
                            },
                            orderBy: { position: 'asc' },
                            include: {
                                assignee: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        teams: {
                                            select: {
                                                team: {
                                                    select: {
                                                        id: true,
                                                        name: true,
                                                        color: true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                escalatedTo: {
                                    include: { column: true }
                                }
                            }
                        }
                    }
                },
            },
        });
        if (!board) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Board not found' } });
        }
        res.json(board);
    } catch (error) {
        next(error);
    }
});

// POST /boards (Admin only)
router.post('/', async (req, res, next) => {
    try {
        const user = req.user;
        // Check Admin
        if (!user?.roles?.includes('Admin') && !user?.roles?.includes('SuperUser')) {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admins only' } });
        }

        const { name, workspaceId, color } = req.body;

        // Simple slug generation
        const slug = name.toLowerCase().replace(/[^a-z0-1]+/g, '-');

        const board = await prisma.board.create({
            data: {
                name,
                slug,
                color: color || '#3b82f6',
                workspaceId: workspaceId || (await prisma.workspace.findFirst())?.id // Fallback to first workspace
            }
        });

        // Add creator as Admin member
        // Add creator as Admin member
        await prisma.boardMember.create({
            data: {
                boardId: board.id,
                userId: user.id,
                role: 'Admin'
            }
        });

        // Create columns: use provided columns or defaults
        const columnsToCreate = (req.body.columns && Array.isArray(req.body.columns) && req.body.columns.length > 0)
            ? req.body.columns.map((colName: string, index: number) => ({
                name: colName,
                position: index,
                isFinal: index === req.body.columns.length - 1
            }))
            : [
                { name: 'To Do', position: 0 },
                { name: 'In Progress', position: 1 },
                { name: 'Done', position: 2, isFinal: true }
            ];

        for (const col of columnsToCreate) {
            await prisma.column.create({
                data: {
                    boardId: board.id,
                    name: col.name,
                    position: col.position,
                    isFinal: col.isFinal || false
                }
            });
        }

        res.status(201).json(board);
    } catch (error) {
        next(error);
    }
});

// POST /boards/:boardId/members (Admin only)
router.post('/:boardId/members', async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const { userId, role } = req.body;

        const user = req.user;
        if (!user?.roles?.includes('Admin') && !user?.roles?.includes('SuperUser')) {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admins only' } });
        }

        const member = await prisma.boardMember.create({
            data: {
                boardId,
                userId,
                role: role || 'Member'
            }
        });
        res.status(201).json(member);
    } catch (error) {
        next(error);
    }
});


// GET /boards/:boardId/members
router.get('/:boardId/members', async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const members = await prisma.boardMember.findMany({
            where: { boardId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        res.json(members);
    } catch (error) {
        next(error);
    }
});

// POST /boards/:boardId/columns
router.post('/:boardId/columns', async (req, res, next) => {
    // Check Manager role (TODO)
    try {
        const { boardId } = req.params;
        const { name, position, isFinal } = req.body;

        const column = await prisma.column.create({
            data: {
                boardId,
                name,
                position,
                isFinal: isFinal || false,
            },
        });
        res.status(201).json(column);
    } catch (error) {
        next(error);
    }
});

// PUT /boards/:boardId/columns/:columnId
router.put('/:boardId/columns/:columnId', async (req, res, next) => {
    try {
        const { boardId, columnId } = req.params;
        const { name, position, isFinal, color } = req.body;

        const column = await prisma.column.update({
            where: { id: columnId },
            data: {
                name,
                position,
                isFinal,
                color,
            }
        });
        res.json(column);
    } catch (error) {
        next(error);
    }
});

// DELETE /boards/:boardId/columns/:columnId
router.delete('/:boardId/columns/:columnId', async (req, res, next) => {
    try {
        const { boardId, columnId } = req.params;

        // Check if column has cards?
        // For now, allow delete and cascade (or error if relations exist, Prisma defaults might restricted)
        // Schema doesn't specify cascade, so let's delete cards first or handle error.
        // Let's assume we want to delete cards in the column for now or move them? 
        // Simplest: Delete column and its cards.

        await prisma.case.deleteMany({
            where: { columnId }
        });

        await prisma.column.delete({
            where: { id: columnId }
        });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// PUT /boards/:boardId (Admin/Manager)
router.put('/:boardId', async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const { name, description, color } = req.body;
        const user = req.user;

        // Verify permissions (SuperUser, Admin, or Board Admin)
        // For now, simpler check: Admin/SuperUser only for editing board meta
        if (!user?.roles?.includes('Admin') && !user?.roles?.includes('SuperUser')) {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admins only' } });
        }

        const board = await prisma.board.update({
            where: { id: boardId },
            data: {
                name,
                description,
                color
            }
        });
        res.json(board);
    } catch (error) {
        next(error);
    }
});

// DELETE /boards/:boardId/members/:userId (Admin only)
router.delete('/:boardId/members/:userId', async (req, res, next) => {
    try {
        const { boardId, userId } = req.params;
        const user = req.user;

        if (!user?.roles?.includes('Admin') && !user?.roles?.includes('SuperUser')) {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admins only' } });
        }

        await prisma.boardMember.deleteMany({
            where: {
                boardId,
                userId
            }
        });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// POST /boards/:boardId/teams
router.post('/:boardId/teams', async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const { teamId, role } = req.body;
        const user = req.user;

        if (!user?.roles?.includes('Admin') && !user?.roles?.includes('SuperUser')) {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admins only' } });
        }

        const assignment = await prisma.boardTeam.create({
            data: {
                boardId,
                teamId,
                role: role || 'Member'
            }
        });
        res.status(201).json(assignment);
    } catch (error) {
        next(error);
    }
});

// DELETE /boards/:boardId/teams/:teamId
router.delete('/:boardId/teams/:teamId', async (req, res, next) => {
    try {
        const { boardId, teamId } = req.params;
        const user = req.user;

        if (!user?.roles?.includes('Admin') && !user?.roles?.includes('SuperUser')) {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admins only' } });
        }

        await prisma.boardTeam.deleteMany({
            where: {
                boardId,
                teamId
            }
        });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// DELETE /boards/:boardId (Admin only)
router.delete('/:boardId', async (req, res, next) => {
    try {
        const { boardId } = req.params;
        const user = req.user;

        // 1. Check Permissions
        if (!user?.roles?.includes('Admin') && !user?.roles?.includes('SuperUser')) {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admins only' } });
        }

        // 2. Check if board exists
        const board = await prisma.board.findUnique({ where: { id: boardId } });
        if (!board) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Board not found' } });
        }

        // 3. Transaction to delete everything
        await prisma.$transaction(async (tx: any) => {
            // Delete Ingress Rules targeting this board or its columns
            // Since IngressRule links to Board and Column, we should delete them.
            // Note: Schema has targetBoardId on IngressRule.
            await tx.ingressRule.deleteMany({ where: { targetBoardId: boardId } });

            // Delete Rules
            await tx.rule.deleteMany({ where: { boardId } });

            // Delete BoardMembers
            await tx.boardMember.deleteMany({ where: { boardId } });

            // Delete Cases (and rely on Prisma middleware or separate delete for relations if needed)
            // For now, getting all case IDs to delete related data would be safest if no cascade
            // But let's assume simple deletions for MVP, or deleteMany.
            // CaseNote, CaseEmail, etc need manual delete if no relation cascade.
            // Let's do a best-effort simpler delete for now or assume strict schema isn't blocking.
            // Checking schema: CaseNote has caseId. CaseEmail has caseId. 
            // We should probably find all cases first.
            const cases = await tx.case.findMany({ where: { boardId }, select: { id: true } });
            const caseIds = cases.map((c: any) => c.id);

            if (caseIds.length > 0) {
                await tx.caseNote.deleteMany({ where: { caseId: { in: caseIds } } });
                await tx.caseEmail.deleteMany({ where: { caseId: { in: caseIds } } });
                await tx.caseAttachment.deleteMany({ where: { caseId: { in: caseIds } } });
                await tx.case.deleteMany({ where: { boardId } });
            }

            // Delete Columns
            await tx.column.deleteMany({ where: { boardId } });

            // finally Delete Board
            await tx.board.delete({ where: { id: boardId } });
        });

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export default router;
