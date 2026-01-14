import { Router } from 'express';

const router = Router();

// POST /webhooks/sendgrid/inbound
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Configure Multer for Email Attachments
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = 'uploads/emails';
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

// POST /webhooks/sendgrid/inbound
// SendGrid sends multipart/form-data
router.post('/sendgrid/inbound', upload.any(), async (req, res, next) => {
    try {
        const { to, cc, from, subject, text, html, message_id, in_reply_to } = req.body;
        const files = req.files as Express.Multer.File[];

        console.log(`Received email from: ${from} | Subject: ${subject}`);

        // 1. Extract Slug
        // Look for pattern: card-<slug>@...
        const recipientString = `${to || ''},${cc || ''}`;
        const match = recipientString.toLowerCase().match(/card-([a-z0-9]+)@/);

        if (!match) {
            console.log('No card slug found in recipients, ignoring.');
            return res.status(200).send('Ignored - No Slug');
        }

        const slug = match[1];

        // 2. Find Case
        const kase = await prisma.case.findUnique({
            where: { emailSlug: slug }
        });

        if (!kase) {
            console.log(`Case not found for slug: ${slug}, ignoring.`);
            return res.status(200).send('Ignored - Case Not Found');
        }

        // 3. Create CaseEmail
        const email = await prisma.caseEmail.create({
            data: {
                caseId: kase.id,
                direction: 'in',
                from: from || 'Unknown',
                to: to || '',
                cc: cc || '',
                subject: subject || '(No Subject)',
                bodyText: text || '',
                bodyHtml: html || '',
                messageId: message_id || null, // SendGrid might pass generic args, adjust as needed
                inReplyTo: in_reply_to || null,
            }
        });

        // 4. Handle Attachments
        if (files && files.length > 0) {
            for (const file of files) {
                await prisma.caseEmailAttachment.create({
                    data: {
                        emailId: email.id,
                        fileName: file.originalname,
                        mimeType: file.mimetype,
                        sizeBytes: file.size,
                        blobPath: file.path.replace(/\\/g, '/'),
                        contentId: null // content-id for inline images is separate, simpler to ignore for now
                    }
                });
            }
        }

        console.log(`Email attached to case ${kase.id}`);
        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook Error:', error);
        // SendGrid expects 200, otherwise it retries.
        // If it's a code error, we might want 500 but for now let's be safe.
        res.status(500).send('Error');
    }
});

export default router;
