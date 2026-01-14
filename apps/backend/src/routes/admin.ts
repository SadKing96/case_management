import { Router } from 'express';
import { requireAuth, requireSuperUser } from '../middleware/auth';
import { prisma } from '../db/prisma';

const router = Router();

router.use(requireSuperUser);

router.get('/db-stats', async (req, res) => {
    try {
        const stats = await Promise.all([
            prisma.user.count().then(count => ({ name: 'User', count })),
            prisma.workspace.count().then(count => ({ name: 'Workspace', count })),
            prisma.board.count().then(count => ({ name: 'Board', count })),
            prisma.column.count().then(count => ({ name: 'Column', count })),
            prisma.case.count().then(count => ({ name: 'Case', count })),
            prisma.caseNote.count().then(count => ({ name: 'CaseNote', count })),
            prisma.caseEmail.count().then(count => ({ name: 'CaseEmail', count })),
            prisma.caseAttachment.count().then(count => ({ name: 'CaseAttachment', count })),
            prisma.caseEmailAttachment.count().then(count => ({ name: 'CaseEmailAttachment', count })),
            prisma.rule.count().then(count => ({ name: 'Rule', count })),
            prisma.auditLog.count().then(count => ({ name: 'AuditLog', count })),
        ]);

        // Calculate total database size (estimate)
        let size = 'Unknown';
        try {
            const dbSizeQuery: any = await prisma.$queryRaw`
                SELECT pg_size_pretty(pg_database_size(current_database())) as size;
            `;
            size = Array.isArray(dbSizeQuery) ? dbSizeQuery[0]?.size : 'Unknown';
        } catch (e) {
            console.warn('Failed to get DB size:', e);
            // Ignore error and return 'Unknown'
        }

        res.json({
            stats,
            size
        });
    } catch (error) {
        console.error('Failed to fetch DB stats:', error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch database stats' } });
    }
});

export default router;
