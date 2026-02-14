
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ScanSource = 'email' | 'note' | 'case';

export class ComplianceService {

    // Regex Patterns
    private patterns = {
        ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
        creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
        urgentKeywords: /\b(urgent|asap|now|immediately|crisis)\b/i,
        legalKeywords: /\b(sue|lawyer|attorney|legal action|compliance breach)\b/i,
        hostileKeywords: /\b(hate|stupid|idiot|incompetent|ridiculous)\b/i,
    };

    /**
     * Scans text for compliance risks and logs flags if found.
     */
    async scanContent(text: string, source: ScanSource, sourceId: string) {
        if (!text) return;

        const flags = [];

        // Check PII
        if (this.patterns.ssn.test(text)) {
            flags.push(this.createFlagObject('pii', 'high', 'Potential SSN detected', source, sourceId, text));
        }
        if (this.patterns.creditCard.test(text)) {
            flags.push(this.createFlagObject('pii', 'critical', 'Potential Credit Card number detected', source, sourceId, text));
        }

        // Check Legal
        if (this.patterns.legalKeywords.test(text)) {
            const match = text.match(this.patterns.legalKeywords)?.[0];
            flags.push(this.createFlagObject('keyword', 'high', `Legal threat keyword detected: "${match}"`, source, sourceId, text));
        }

        // Check Hostility
        if (this.patterns.hostileKeywords.test(text)) {
            const match = text.match(this.patterns.hostileKeywords)?.[0];
            flags.push(this.createFlagObject('sentiment', 'medium', `Hostile language detected: "${match}"`, source, sourceId, text));
        }

        // Save flags
        if (flags.length > 0) {
            await (prisma as any).complianceFlag.createMany({
                data: flags
            });
            console.log(`[Compliance] Flagged ${flags.length} risks in ${source} ${sourceId}`);
        }
    }

    private createFlagObject(type: string, severity: string, description: string, source: ScanSource, sourceId: string, fullText: string) {
        // Extract snippet (simple substring around match could be better, but full text for now is okay for internal tool)
        const snippet = fullText.length > 100 ? fullText.substring(0, 100) + '...' : fullText;

        return {
            type,
            severity,
            description,
            status: 'open',
            sourceText: snippet,
            // Map sourceId to correct column
            caseId: source === 'case' ? sourceId : null,
            emailId: source === 'email' ? sourceId : null,
            noteId: source === 'note' ? sourceId : null,
        };
    }
}

export const complianceService = new ComplianceService();
