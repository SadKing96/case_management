import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import * as xlsx from 'xlsx';
import { generateEmailSlug } from '../utils/slugs';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

// --- Rules ---

// Get all rules
router.get('/rules', async (req, res) => {
    try {
        const rules = await prisma.ingressRule.findMany({
            include: { targetBoard: true, targetColumn: true }
        });
        res.json(rules);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch rules' });
    }
});

// Create a rule
router.post('/rules', async (req, res) => {
    try {
        const { name, keyword, targetBoardId, targetColumnId } = req.body;
        const rule = await prisma.ingressRule.create({
            data: { name, keyword, targetBoardId, targetColumnId }
        });
        res.json(rule);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create rule' });
    }
});

// Delete a rule
router.delete('/rules/:id', async (req, res) => {
    try {
        await prisma.ingressRule.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete rule' });
    }
});

// --- Upload ---

// Upload and Parse Sheet
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        // This endpoint just parses and returns the headers/preview
        // The frontend will then ask to "Execute" the import with mapping

        if (data.length === 0) {
            return res.json({ headers: [], preview: [] });
        }

        const headers = Object.keys(data[0] as object);
        const preview = data.slice(0, 5);

        res.json({ headers, preview, totalRows: data.length });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to process file' });
    }
});

// Execute Import (File based for simplification)
router.post('/import-file', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const mapping = JSON.parse(req.body.mapping);
        const targetBoardId = req.body.targetBoardId;
        const targetColumnId = req.body.targetColumnId;

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        let createdCount = 0;

        for (const row of data as any[]) {
            const title = row[mapping.title] || 'Untitled Card';
            const description = row[mapping.description] || '';
            const priority = row[mapping.priority] || 'Medium';

            await prisma.case.create({
                data: {
                    title: String(title),
                    description: String(description),
                    priority: String(priority),
                    position: 0,
                    formPayloadJson: '{}',
                    boardId: targetBoardId,
                    columnId: targetColumnId,
                    emailSlug: generateEmailSlug()
                }
            });
            createdCount++;
        }

        res.json({ success: true, count: createdCount });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ error: 'Failed to import data' });
    }
});

// Execute Import (Create Cards)
router.post('/import', async (req, res) => {
    try {
        const { rows, mapping, targetBoardId, targetColumnId } = req.body;
        // rows: array of objects from the sheet
        // mapping: { title: 'HeaderName', description: 'HeaderName', priority: 'HeaderName' }

        let createdCount = 0;

        for (const row of rows) {
            const title = row[mapping.title] || 'Untitled Card';
            const description = row[mapping.description] || '';
            const priority = row[mapping.priority] || 'Medium';

            await prisma.case.create({
                data: {
                    title: String(title),
                    description: String(description),
                    priority: String(priority),
                    position: 0,
                    formPayloadJson: '{}',
                    boardId: targetBoardId,
                    columnId: targetColumnId,
                    emailSlug: generateEmailSlug()
                }
            });
            createdCount++;
        }

        res.json({ success: true, count: createdCount });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ error: 'Failed to import data' });
    }
});

export default router;
