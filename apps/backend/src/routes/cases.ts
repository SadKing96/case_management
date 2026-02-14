import { Router } from 'express';
import { prisma } from '../db/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { generateEmailSlug } from '../utils/slugs';
import { crmService } from '../services/crm';

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = 'uploads/cases';
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    })
});

const router = Router();

// POST /import - Import from CRM
router.post('/import', async (req, res, next) => {
    try {
        const { crmSystem, crmId, boardId, columnId } = req.body;

        // Fetch from CRM Service
        const record = await crmService.fetchRecord(crmId, crmSystem);

        // Resolve Board (if handled by ID or Slug) - Reuse logic or keep simple
        // For import, we assume boardId is passed correctly from frontend (which has the board contest)

        const nextPosition = 10000; // Simplified

        const newCase = await prisma.case.create({
            data: {
                title: record.title,
                description: record.description,
                caseType: record.entityType.toUpperCase(),
                customerName: record.customerName,
                crmSystem: record.system,
                crmId: record.id,
                crmData: JSON.stringify(record.data),

                boardId,
                columnId,
                position: nextPosition,
                formPayloadJson: JSON.stringify({ imported: true, value: record.value }),
                priority: 'Medium',
                emailSlug: generateEmailSlug(),
            }
        });

        res.status(201).json(newCase);
    } catch (error) {
        next(error);
    }
});

// GET /cases
router.get('/', async (req, res, next) => {
    try {
        const { active = 'true', boardId, page, limit } = req.query;
        const isActive = active === 'true';

        const where: any = {};
        if (isActive) {
            where.closedAt = null;
            where.archivedAt = null;
        }
        where.deletedAt = null;

        // Security: Filter for Clients
        if (req.user?.roles?.includes('Client')) {
            where.creatorId = req.user.id;
        } else if (boardId) {
            where.boardId = boardId;
        }

        const pageNum = page ? parseInt(page as string) : undefined;
        const limitNum = limit ? parseInt(limit as string) : undefined;

        // Pagination props
        const take = limitNum;
        const skip = (pageNum && limitNum) ? (pageNum - 1) * limitNum : undefined;

        const [cases, total] = await Promise.all([
            prisma.case.findMany({
                where,
                include: {
                    board: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            color: true
                        }
                    },
                    column: {
                        select: {
                            id: true,
                            name: true,
                            color: true
                        }
                    },
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
                },
                orderBy: {
                    updatedAt: 'desc'
                },
                take,
                skip
            }),
            prisma.case.count({ where })
        ]);

        // Return pagination headers
        res.setHeader('X-Total-Count', total);
        if (pageNum) res.setHeader('X-Page', pageNum);
        if (limitNum) res.setHeader('X-Limit', limitNum);

        res.json(cases);
    } catch (error) {
        next(error);
    }
});

// GET /cases/trash - Get all soft-deleted cases (Trash)
router.get('/trash/all', async (req, res, next) => {
    try {
        const cases = await prisma.case.findMany({
            where: {
                NOT: { deletedAt: null }
            },
            include: {
                board: { select: { id: true, name: true, slug: true, color: true } },
                column: { select: { id: true, name: true, color: true } },
                assignee: { select: { id: true, name: true, email: true } }
            },
            orderBy: { deletedAt: 'desc' }
        });
        res.json(cases);
    } catch (error) {
        next(error);
    }
});

// GET /cases/:caseId
router.get('/:caseId', async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const kase = await prisma.case.findUnique({
            where: { id: caseId },
            include: {
                _count: {
                    select: { notes: true, emails: true, attachments: true }
                },
                attachments: {
                    orderBy: { uploadedAt: 'desc' }
                },
                assignee: {
                    select: { id: true, name: true, email: true }
                },
                escalatedTo: {
                    include: { column: true }
                }
            }
        });
        if (!kase) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Case not found' } });
        }
        // Security check for Client
        if (req.user?.roles?.includes('Client') && kase.creatorId !== req.user.id) {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not authorized' } });
        }
        res.json(kase);
    } catch (error) {
        next(error);
    }
});

// POST /cases - Create a new case
router.post('/', async (req, res, next) => {
    try {
        const { title, priority, assigneeId, opdsl, boardId } = req.body;

        let targetBoardId = boardId;

        // Auto-resolve board for Client if not provided or just to be safe
        if (req.user?.roles?.includes('Client')) {
            if (!targetBoardId) {
                // Find default ingress board? or just the first board in the workspace
                const defaultBoard = await prisma.board.findFirst();
                if (defaultBoard) targetBoardId = defaultBoard.id;
            }
        }

        if (!targetBoardId) {
            return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'boardId is required' } });
        }

        // 0. Resolve Board ID (Handle Slugs)
        const board = await prisma.board.findFirst({
            where: {
                OR: [
                    { id: targetBoardId },
                    { slug: targetBoardId }
                ]
            }
        });

        if (!board) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Board not found' } });
        }

        const resolvedBoardId = board.id;

        // 1. Find the first column of the board
        const firstColumn = await prisma.column.findFirst({
            where: { boardId: resolvedBoardId },
            orderBy: { position: 'asc' }
        });

        if (!firstColumn) {
            return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Board has no columns' } });
        }

        // 2. Determine new position (append to end of column)
        const lastCase = await prisma.case.findFirst({
            where: { columnId: firstColumn.id },
            orderBy: { position: 'desc' }
        });
        const newPosition = lastCase ? lastCase.position + 1 : 0;

        // 3. Create the case
        const caseData: any = {
            title,
            priority: priority || 'medium',
            assigneeId: assigneeId || null,
            opdsl: opdsl ? new Date(opdsl) : null,
            boardId: resolvedBoardId,
            columnId: firstColumn.id,
            position: newPosition,
            formPayloadJson: '{}', // Default empty
            caseType: req.body.type || 'ORDER',
            emailSlug: generateEmailSlug(),
            creatorId: req.user?.id // Track creator
        };

        if (caseData.caseType === 'QUOTE') {
            caseData.quoteId = Math.random().toString(36).substring(2, 10).toUpperCase(); // Simple alphanumeric ID
            caseData.productType = req.body.productType;
            caseData.specs = req.body.specs;
            caseData.customerName = req.body.customerName; // Internal user might set this manually
        }

        // If Client, ensure customerName matches
        if (req.user?.roles?.includes('Client')) {
            caseData.customerName = req.user.name;
        }

        const newCase = await prisma.case.create({
            data: caseData
        });

        res.status(201).json(newCase);
    } catch (error) {
        next(error);
    }
});

// POST /cases/:caseId/move
router.post('/:caseId/move', async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const { columnId, position } = req.body;

        // TODO: Handle concurrency/ordering updates
        const updated = await prisma.case.update({
            where: { id: caseId },
            data: {
                columnId,
                position
            }
        });
        res.json(updated);
    } catch (error) {
        next(error);
    }
});

// GET /cases/:caseId/notes
router.get('/:caseId/notes', async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const notes = await prisma.caseNote.findMany({
            where: { caseId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(notes);
    } catch (error) {
        next(error);
    }
});

// GET /cases/:caseId/emails
router.get('/:caseId/emails', async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const emails = await prisma.caseEmail.findMany({
            where: { caseId },
            include: { attachments: true },
            orderBy: { receivedAt: 'desc' }
        });
        res.json(emails);
    } catch (error) {
        next(error);
    }
});

// POST /cases/:caseId/notes
router.post('/:caseId/notes', async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const { content } = req.body;
        // const userId = req.user.id; 

        // Mock userId for now since we don't have user sync yet
        const note = await prisma.caseNote.create({
            data: {
                caseId,
                content,
                authorId: 'user-placeholder',
            }
        });
        res.status(201).json(note);
    } catch (error) {
        next(error);
    }
});

// PUT /cases/:caseId - Update case details
router.put('/:caseId', async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const updates = req.body;

        const updated = await prisma.case.update({
            where: { id: caseId },
            data: updates
        });
        res.json(updated);
    } catch (error) {
        next(error);
    }
});

// PATCH /cases/:caseId/archive - Archive a case
router.patch('/:caseId/archive', async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const updated = await prisma.case.update({
            where: { id: caseId },
            data: { archivedAt: new Date() }
        });
        res.json(updated);
    } catch (error) {
        next(error);
    }
});

// DELETE /cases/:caseId - Soft delete a case
router.delete('/:caseId', async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const { permanent } = req.query;

        if (permanent === 'true') {
            await prisma.case.delete({
                where: { id: caseId }
            });
        } else {
            // Check for related escalated case (Original case -> Escalated Copy)
            const kase = await prisma.case.findUnique({
                where: { id: caseId },
                select: { escalatedToId: true }
            });

            const transactions = [
                prisma.case.update({
                    where: { id: caseId },
                    data: { deletedAt: new Date() }
                })
            ];

            // If this case points to an escalated copy, delete that copy too (or soft delete)
            if (kase?.escalatedToId) {
                transactions.push(
                    prisma.case.update({
                        where: { id: kase.escalatedToId },
                        data: { deletedAt: new Date() }
                    })
                );
            }

            // If this is a COPY (escalatedFrom relation exists), we might want to unlink the original?
            // But we can't easily query 'escalatedFrom' without 'include'. 
            // It's cleaner to just leave it (Original keeps link to deleted copy, or we clean up).

            await prisma.$transaction(transactions);
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// POST /cases/:caseId/restore - Restore a soft-deleted case
router.post('/:caseId/restore', async (req, res, next) => {
    try {
        const { caseId } = req.params;
        const updated = await prisma.case.update({
            where: { id: caseId },
            data: { deletedAt: null }
        });
        res.json(updated);
    } catch (error) {
        next(error);
    }
});

// POST /cases/:caseId/escalate - Escalate a case
router.post('/:caseId/escalate', async (req, res, next) => {
    try {
        const { caseId } = req.params;

        // 1. Get original case
        const originalCase = await prisma.case.findUnique({
            where: { id: caseId }
        });

        if (!originalCase) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Case not found' } });
        }

        // 2. Find or Create "Escalations" Column
        let escalationsColumn = await prisma.column.findFirst({
            where: {
                boardId: originalCase.boardId,
                name: 'Escalations'
            }
        });

        if (!escalationsColumn) {
            // Get max position to append
            const lastCol = await prisma.column.findFirst({
                where: { boardId: originalCase.boardId },
                orderBy: { position: 'desc' }
            });

            escalationsColumn = await prisma.column.create({
                data: {
                    boardId: originalCase.boardId,
                    name: 'Escalations',
                    position: lastCol ? lastCol.position + 1 : 0,
                    color: '#ef4444', // Red
                    isFinal: false
                }
            });
        }

        // 3. Determine new position in Escalations column
        const lastCaseInEsc = await prisma.case.findFirst({
            where: { columnId: escalationsColumn.id },
            orderBy: { position: 'desc' }
        });

        const newPosition = lastCaseInEsc ? lastCaseInEsc.position + 1 : 0;

        // 4. Duplicate Case
        // Omit id, createdAt, updatedAt, etc.
        // escalatedFromId does not exist as a scalar.
        // We only exclude keys that exist on the Case type.
        const { id, createdAt, updatedAt, closedAt, archivedAt, deletedAt, escalatedToId, ...caseData } = originalCase;

        // Check if already escalated?
        if (originalCase.escalatedToId) {
            // Already escalated. Return existing or specific error? 
            // Let's just return the existing one if found, or maybe just proceed (if old one was deleted? logic gets complex).
            // For now, let's assume we allow re-escalation or just block. 
            // Simplest: If already escalated to a case that exists and isn't deleted/closed, block.
            // But for now, let's just proceed and overwrite the link (newest escalation wins).
        }

        const newCase = await prisma.case.create({
            data: {
                ...caseData,
                columnId: escalationsColumn.id,
                position: newPosition,
                title: `[ESCALATED] ${caseData.title}`,
                // escalatedFromId is not a real field. The link is made by updating the original.
            }
        });

        // 5. Link Original to New
        await prisma.case.update({
            where: { id: originalCase.id },
            data: { escalatedToId: newCase.id }
        });

        res.status(201).json(newCase);

    } catch (error) {
        next(error);
    }
});

// POST /cases/:caseId/deescalate - De-escalate a case
router.post('/:caseId/deescalate', async (req, res, next) => {
    try {
        const { caseId } = req.params;

        // 1. Identify Case and its counterpart
        // fetch relations to know if it's original or copy
        const kase = await prisma.case.findUnique({
            where: { id: caseId },
            include: { escalatedTo: true, escalatedFrom: true }
        });

        if (!kase) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Case not found' } });
        }

        let targetCaseId = kase.id;

        // If this is the ORIGINAL case (has escalatedTo), we want to move the ESCALATED copy.
        if (kase.escalatedTo) {
            targetCaseId = kase.escalatedTo.id;
        }
        // If this is the escalated copy (has escalatedFrom), we move THIS case.
        // But we might want to unlink? 
        // Logic: Move targetCase to "De-escalated".

        // Use targetCase to get boardId if we switched
        if (targetCaseId !== kase.id) {
            // We need to fetch the target case to be sure of its board?
            // Or rely on kase.escalatedTo
            // kase.escalatedTo is the target case object.
        }

        // Refetch target if needed or use relation data
        const targetCase = await prisma.case.findUnique({ where: { id: targetCaseId } });
        if (!targetCase) return res.status(404).json({ error: 'Escalated case not found' });

        let deescalatedCol = await prisma.column.findFirst({
            where: {
                boardId: targetCase.boardId,
                name: 'De-escalated'
            }
        });

        if (!deescalatedCol) {
            const lastCol = await prisma.column.findFirst({
                where: { boardId: targetCase.boardId },
                orderBy: { position: 'desc' }
            });
            deescalatedCol = await prisma.column.create({
                data: {
                    boardId: targetCase.boardId,
                    name: 'De-escalated',
                    position: lastCol ? lastCol.position + 1 : 0,
                    color: '#10b981', // Green
                    isFinal: false
                }
            });
        }

        // 3. Move Case & Unlink
        // We probably want to remove the 'escalatedToId' from the original case so the icon disappears.
        // If targetCase is the Copy, we need to find the Original to unlink it.
        // We can do that by searching where escalatedToId == targetCase.id

        // 3. Move Case (Keep Link for History/Cascade)
        await prisma.case.update({
            where: { id: targetCaseId },
            data: {
                columnId: deescalatedCol.id,
                // We keep the link so we have history, but front-end can check column name to decide if "Active Escalation"
            }
        });

        res.json({ message: 'De-escalated successfully', id: targetCaseId });

    } catch (error) {
        next(error);
    }
});

// POST /cases/:caseId/attachments
router.post('/:caseId/attachments', upload.single('file'), async (req, res, next) => {
    try {
        const { caseId } = req.params;
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const attachment = await prisma.caseAttachment.create({
            data: {
                caseId,
                fileName: req.file.originalname,
                mimeType: req.file.mimetype,
                sizeBytes: req.file.size,
                blobPath: req.file.path.replace(/\\/g, '/') // Normalise path for usage
            }
        });
        res.status(201).json(attachment);
    } catch (error) {
        next(error);
    }
});

export default router;
