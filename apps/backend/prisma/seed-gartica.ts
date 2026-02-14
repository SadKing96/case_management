import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const CONFIG = {
    targetUserCount: 50,
    targetCaseCount: 1000,
    emailsToGenerate: 10000,
    notesToGenerate: 5000,
    flagsToGenerate: 500,
    insightsToGenerate: 150,
    assetsToGenerate: 500
};

async function main() {
    console.log('🔮 Starting Gartica specialized seed...');
    const start = Date.now();

    // 1. Ensure User Base
    console.log('Checking user base...');
    let users = await prisma.user.findMany();
    if (users.length < CONFIG.targetUserCount) {
        console.log(`Creating ${CONFIG.targetUserCount - users.length} more users...`);
        const usersToCreate = CONFIG.targetUserCount - users.length;
        for (let i = 0; i < usersToCreate; i++) {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const user = await prisma.user.create({
                data: {
                    email: faker.internet.email({ firstName, lastName, provider: 'example.com' }), // ensure unique-ish
                    name: `${firstName} ${lastName}`,
                    roles: 'User',
                    isActive: true
                }
            });
            users.push(user);
        }
    }
    console.log(`✅ Using ${users.length} users.`);

    // 2. Ensure Case Base
    console.log('Checking case base...');
    let cases = await prisma.case.findMany({ select: { id: true, boardId: true } });

    // If not enough cases, we need a board to attach them to.
    if (cases.length < CONFIG.targetCaseCount) {
        let board = await prisma.board.findFirst();
        let column = await prisma.column.findFirst({ where: { boardId: board?.id } });

        if (!board || !column) {
            // Minimal bootstrap if DB is completely empty
            const workspace = await prisma.workspace.upsert({
                where: { id: 'gartica-seed-ws' },
                update: {},
                create: { id: 'gartica-seed-ws', name: 'Gartica Seed WS', domain: 'gartica.local' }
            });
            board = await prisma.board.create({
                data: {
                    workspaceId: workspace.id,
                    name: 'Gartica Seed Board',
                    slug: 'gartica-seed-' + Date.now(),
                    color: '#10b981'
                }
            });
            column = await prisma.column.create({
                data: { boardId: board.id, name: 'Inbox', position: 0 }
            });
        }

        console.log(`Creating ${CONFIG.targetCaseCount - cases.length} more cases...`);
        const casesToCreate = CONFIG.targetCaseCount - cases.length;

        // Batch create cases using $transaction
        const batchSize = 50; // Smaller batch for transaction safety
        for (let i = 0; i < casesToCreate; i += batchSize) {
            const currentBatchSize = Math.min(batchSize, casesToCreate - i);
            const creates = Array.from({ length: currentBatchSize }).map((_, idx) =>
                prisma.case.create({
                    data: {
                        boardId: board!.id,
                        columnId: column!.id,
                        title: faker.hacker.phrase(),
                        description: faker.lorem.sentence(),
                        position: 0,
                        formPayloadJson: '{}',
                        caseType: 'ORDER',
                        createdAt: faker.date.past()
                    }
                })
            );
            await prisma.$transaction(creates);
        }

        // Re-fetch all cases
        cases = await prisma.case.findMany({ select: { id: true, boardId: true } });
    }
    console.log(`✅ Using ${cases.length} cases.`);

    // 3. Generate Emails (The meat of Gartica analysis)
    console.log(`Creating ${CONFIG.emailsToGenerate} emails...`);
    // Batch emails
    const emailChunkSize = 50;
    const emailBatches = Math.ceil(CONFIG.emailsToGenerate / emailChunkSize);

    for (let b = 0; b < emailBatches; b++) {
        const batchOps = [];
        for (let i = 0; i < emailChunkSize; i++) {
            const linkedCase = faker.helpers.arrayElement(cases);
            const direction = faker.helpers.arrayElement(['in', 'out']);
            const sender = direction === 'in' ? faker.internet.email() : faker.helpers.arrayElement(users).email;

            batchOps.push(prisma.caseEmail.create({
                data: {
                    caseId: linkedCase.id,
                    direction,
                    from: sender,
                    to: faker.internet.email(),
                    cc: '',
                    subject: faker.company.catchPhrase(),
                    bodyText: faker.lorem.paragraph(),
                    receivedAt: faker.date.recent({ days: 60 })
                }
            }));
        }
        await prisma.$transaction(batchOps);
        if (b % 10 === 0) process.stdout.write('.');
    }
    console.log('\n✅ Emails created.');

    // 4. Generate Notes
    console.log(`Creating ${CONFIG.notesToGenerate} notes...`);
    const noteChunkSize = 50;
    const noteBatches = Math.ceil(CONFIG.notesToGenerate / noteChunkSize);

    for (let b = 0; b < noteBatches; b++) {
        const batchOps = [];
        for (let i = 0; i < noteChunkSize; i++) {
            const linkedCase = faker.helpers.arrayElement(cases);
            batchOps.push(prisma.caseNote.create({
                data: {
                    caseId: linkedCase.id,
                    authorId: faker.helpers.arrayElement(users).id,
                    content: faker.hacker.phrase() + ' ' + faker.lorem.sentences(2),
                    createdAt: faker.date.recent({ days: 60 })
                }
            }));
        }
        await prisma.$transaction(batchOps);
        if (b % 10 === 0) process.stdout.write('.');
    }
    console.log('\n✅ Notes created.');

    // 5. Generate Compliance Flags
    console.log(`Creating ${CONFIG.flagsToGenerate} compliance flags...`);
    // We need some mock IDs for emails/notes we just created?
    // Doing a full fetch of 10k emails is fine for a seed script.
    const allEmails = await prisma.caseEmail.findMany({ select: { id: true }, take: 2000 }); // Just take a sample to attach to
    const allNotes = await prisma.caseNote.findMany({ select: { id: true }, take: 1000 });

    const flagOps = [];
    for (let i = 0; i < CONFIG.flagsToGenerate; i++) {
        const type = faker.helpers.arrayElement(['pii', 'sentiment', 'keyword']);
        const severity = faker.helpers.arrayElement(['high', 'medium', 'low']);
        const status = faker.helpers.weightedArrayElement([{ weight: 8, value: 'open' }, { weight: 2, value: 'resolved' }]);
        // const status = statusObj.value; // Removed because weightedArrayElement returns the value apparently

        // Randomly attach to email or note
        const attachToEmail = faker.datatype.boolean() && allEmails.length > 0;
        const targetEmailId = attachToEmail ? faker.helpers.arrayElement(allEmails).id : null;
        const targetNoteId = !attachToEmail && allNotes.length > 0 ? faker.helpers.arrayElement(allNotes).id : null;

        flagOps.push(prisma.complianceFlag.create({
            data: {
                type,
                severity,
                description: `Detected ${type} violation: ${faker.lorem.words(3)}`,
                status,
                emailId: targetEmailId,
                noteId: targetNoteId,
                sourceText: faker.lorem.sentence(),
                createdAt: faker.date.recent({ days: 30 })
            }
        }));
    }
    await prisma.$transaction(flagOps);
    console.log('✅ Compliance flags created.');

    // 6. Generate Gartica Insights
    console.log(`Creating ${CONFIG.insightsToGenerate} insights...`);
    const insightOps = [];
    for (let i = 0; i < CONFIG.insightsToGenerate; i++) {
        const type = faker.helpers.arrayElement(['anomaly', 'sentiment', 'performance']);
        const severity = faker.helpers.arrayElement(['critical', 'high', 'medium', 'low']);

        insightOps.push(prisma.garticaInsight.create({
            data: {
                title: faker.company.catchPhrase(),
                type,
                severity,
                description: faker.lorem.paragraph(),
                createdAt: faker.date.recent({ days: 14 })
            }
        }));
    }
    await prisma.$transaction(insightOps);
    console.log('✅ Insights created.');

    // 7. Generate Aftermarket Assets & Opportunities
    console.log(`Creating ${CONFIG.assetsToGenerate} aftermarket assets...`);
    const assetOps = [];
    for (let i = 0; i < CONFIG.assetsToGenerate; i++) {
        const healthScore = faker.number.int({ min: 20, max: 100 });
        const status = healthScore > 80 ? 'Active' : (healthScore > 50 ? 'Maintenance Required' : 'Offline');

        let aiPrediction = null;
        if (healthScore < 60) {
            aiPrediction = faker.helpers.arrayElement([
                'Failure imminent in 2 weeks',
                'Bearing wear detected',
                'Efficiency drop > 15%',
                'Pressure valve anomaly'
            ]);
        }

        // Higher revenue potential for worse health (replacement opportunity)
        const revenuePotential = healthScore < 50
            ? faker.number.int({ min: 50000, max: 250000 }) // Replacement
            : faker.number.int({ min: 5000, max: 25000 });  // Service/Parts

        assetOps.push((prisma as any).aftermarketAsset.create({
            data: {
                serialNumber: faker.string.alphanumeric(8).toUpperCase(),
                model: faker.helpers.arrayElement(['Valve-XRT-5000', 'Pump-G7', 'Actuator-Pro', 'Sensor-Array-V2']),
                customerName: faker.company.name(),
                location: `${faker.location.city()} Plant`,
                installDate: faker.date.past({ years: 5 }),
                status,
                healthScore,
                aiPrediction,
                revenuePotential,
                lastServiceDate: faker.date.past({ years: 1 })
            }
        }));
    }
    // Cast to any because Client types might not be regenerated yet due to lock
    await prisma.$transaction(assetOps);
    console.log('✅ Aftermarket assets created.');

    const duration = (Date.now() - start) / 1000;
    console.log(`🏁 Gartica seed complete in ${duration}s`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
