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

// --- AI Rules ---

// Get all AI rules
router.get('/ai/rules', async (req, res) => {
    try {
        const rules = await prisma.aiIngressRule.findMany({
            include: { targetBoard: true, targetColumn: true }
        });
        res.json(rules);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch AI rules' });
    }
});

// Create AI rule
router.post('/ai/rules', async (req, res) => {
    try {
        const { name, description, schemaJson, targetBoardId, targetColumnId } = req.body;
        const rule = await prisma.aiIngressRule.create({
            data: { name, description, schemaJson, targetBoardId, targetColumnId }
        });
        res.json(rule);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create AI rule' });
    }
});

// Delete AI rule
router.delete('/ai/rules/:id', async (req, res) => {
    try {
        await prisma.aiIngressRule.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete AI rule' });
    }
});

// Mock AI Chat Endpoint
router.post('/ai/chat', async (req, res) => {
    try {
        const { message, currentSchema } = req.body;
        // Mock Logic: simplified keyword extraction to build schema
        const schema = currentSchema ? JSON.parse(currentSchema) : { fields: [] };
        let botResponse = "I didn't understand that. You can ask me to extract specific fields like 'Invoice Number' or 'Customer Name'.";

        const lowerMsg = message.toLowerCase();

        if (lowerMsg.includes('extract') || lowerMsg.includes('capture') || lowerMsg.includes('add')) {
            const newField = { name: '', type: 'string', description: '' };

            if (lowerMsg.includes('po number') || lowerMsg.includes('purchase order')) {
                newField.name = 'poNumber';
                newField.description = 'Purchase Order Number';
                botResponse = "I've added the **PO Number** to the extraction schema.";
            } else if (lowerMsg.includes('customer') || lowerMsg.includes('client')) {
                newField.name = 'customerName';
                newField.description = 'Name of the customer';
                botResponse = "I've added **Customer Name** to the schema.";
            } else if (lowerMsg.includes('invoice')) {
                newField.name = 'invoiceNumber';
                newField.description = 'Invoice identifier';
                botResponse = "Added **Invoice Number**.";
            } else if (lowerMsg.includes('amount') || lowerMsg.includes('total')) {
                newField.name = 'totalAmount';
                newField.type = 'number';
                newField.description = 'Total monetary amount';
                botResponse = "Got it. Tracking the **Total Amount**.";
            } else {
                // Fallback generic
                const words = message.split(' ');
                const lastWord = words[words.length - 1].replace(/[^a-zA-Z]/g, '');
                if (lastWord.length > 2) {
                    newField.name = lastWord.toLowerCase();
                    newField.description = `Extracted ${lastWord}`;
                    botResponse = `Okay, I'll try to extract **${lastWord}** from the emails.`;
                }
            }

            if (newField.name) {
                // Check if exists
                if (!schema.fields.find((f: any) => f.name === newField.name)) {
                    schema.fields.push(newField);
                }
            }
        } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
            botResponse = "Hello! I can help you set up an AI extraction rule. Just tell me what logic you want to apply to incoming emails.";
        } else if (lowerMsg.includes('clear') || lowerMsg.includes('reset')) {
            schema.fields = [];
            botResponse = "I've reset the schema. What should we start with?";
        }

        res.json({
            response: botResponse,
            updatedSchema: JSON.stringify(schema)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'AI processing failed' });
    }
});

// --- Simple Rules ---
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
