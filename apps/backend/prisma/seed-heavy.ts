import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Configuration
const CONFIG = {
    users: 50,
    boards: 10,
    casesPerBoard: 500,
    projects: 5,
    teams: ['Sales', 'Support', 'Engineering', 'Leadership', 'Operations']
};

async function main() {
    console.log('🌱 Starting heavy seed...');

    const start = Date.now();

    // 1. Create Workspace
    const workspace = await prisma.workspace.upsert({
        where: { id: 'heavy-test-workspace' },
        update: {},
        create: {
            id: 'heavy-test-workspace',
            name: 'Heavy Test Workspace',
            domain: 'heavy.local'
        }
    });

    console.log('✅ Workspace created');

    // 2. Create Teams & Users
    const users: any[] = [];
    const teamIds: string[] = [];

    // Create Teams
    for (const teamName of CONFIG.teams) {
        const team = await prisma.team.upsert({
            where: { name: teamName },
            update: {},
            create: {
                name: teamName,
                description: faker.company.catchPhrase(),
                color: faker.color ? faker.color.rgb() : '#3b82f6' // Fallback or use color module
            }
        });
        teamIds.push(team.id);
    }

    // Create Users
    console.log(`Creating ${CONFIG.users} users...`);
    for (let i = 0; i < CONFIG.users; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const email = faker.internet.email({ firstName, lastName });

        const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                name: `${firstName} ${lastName}`,
                roles: i === 0 ? 'Admin' : 'User', // First user is Admin
                isActive: true
            }
        });
        users.push(user);

        // Assign to random team
        const randomTeamId = faker.helpers.arrayElement(teamIds);
        await prisma.teamMember.create({
            data: {
                teamId: randomTeamId,
                userId: user.id
            }
        }).catch(() => { }); // Ignore unique constraint errors if re-seeding
    }

    // 3. Create Projects
    console.log(`Creating ${CONFIG.projects} projects...`);
    const projectIds = [];
    for (let i = 0; i < CONFIG.projects; i++) {
        const project = await prisma.project.create({
            data: {
                name: faker.commerce.productName() + ' Launch',
                description: faker.lorem.sentence(),
                status: faker.helpers.arrayElement(['planning', 'active', 'completed']),
                startDate: faker.date.past(),
                endDate: faker.date.future()
            }
        });
        projectIds.push(project.id);

        // Create Timeline Items
        for (let j = 0; j < 5; j++) {
            await prisma.timelineItem.create({
                data: {
                    projectId: project.id,
                    content: faker.company.buzzPhrase(),
                    start: faker.date.recent(),
                    end: faker.date.soon(),
                    type: 'range',
                    progress: faker.number.int({ min: 0, max: 100 })
                }
            });
        }
    }

    // 4. Create Boards and Cases
    console.log(`Creating ${CONFIG.boards} boards with ~${CONFIG.casesPerBoard} cases each...`);

    for (let b = 0; b < CONFIG.boards; b++) {
        const boardName = `${faker.commerce.department()} Board ${b + 1}`;
        const boardSlug = faker.helpers.slugify(boardName).toLowerCase();

        const board = await prisma.board.upsert({
            where: { slug: boardSlug },
            update: {},
            create: {
                workspaceId: workspace.id,
                name: boardName,
                slug: boardSlug,
                description: faker.lorem.sentence(),
                color: faker.color ? faker.color.rgb() : '#3b82f6'
            }
        });

        // Add random members to board
        const boardMembers = faker.helpers.arrayElements(users, 5);
        for (const member of boardMembers) {
            await prisma.boardMember.create({
                data: {
                    boardId: board.id,
                    userId: member.id,
                    role: 'Member'
                }
            }).catch(() => { });
        }

        // Create Columns
        const colDefs = [
            { name: 'Backlog', position: 0, color: '#94a3b8' },
            { name: 'To Do', position: 1, color: '#3b82f6' },
            { name: 'In Progress', position: 2, color: '#f59e0b' },
            { name: 'Review', position: 3, color: '#8b5cf6' },
            { name: 'Done', position: 4, color: '#10b981', isFinal: true }
        ];

        const columns = [];
        for (const def of colDefs) {
            const col = await prisma.column.create({
                data: {
                    boardId: board.id,
                    name: def.name,
                    position: def.position,
                    isFinal: def.isFinal,
                    color: def.color
                }
            });
            columns.push(col);
        }

        // Create Cases in batches to avoid memory issues
        const batchSize = 100;
        const batches = Math.ceil(CONFIG.casesPerBoard / batchSize);

        for (let batch = 0; batch < batches; batch++) {
            const requests = [];
            for (let k = 0; k < batchSize; k++) {
                // Randomly assign to a column (weighted towards backlogs/active)
                const column = faker.helpers.weightedArrayElement([
                    { weight: 3, value: columns[0] }, // Backlog
                    { weight: 2, value: columns[1] }, // To Do
                    { weight: 4, value: columns[2] }, // In Progress
                    { weight: 2, value: columns[3] }, // Review
                    { weight: 5, value: columns[4] }, // Done
                ]);

                const assignee = faker.datatype.boolean() ? faker.helpers.arrayElement(boardMembers) : null;
                const isQuote = faker.datatype.boolean();

                requests.push(prisma.case.create({
                    data: {
                        boardId: board.id,
                        columnId: column.id,
                        position: k, // distinct enough
                        title: isQuote ? `Quote for ${faker.company.name()}` : faker.hacker.phrase(),
                        description: faker.lorem.paragraph(),
                        priority: faker.helpers.arrayElement(['High', 'Medium', 'Low', 'Critical']),
                        caseType: isQuote ? 'QUOTE' : 'ORDER',

                        // Quote details
                        quoteId: isQuote ? faker.string.alphanumeric(8).toUpperCase() : null,
                        productType: isQuote ? faker.commerce.product() : null,
                        specs: isQuote ? faker.commerce.productAdjective() : null,
                        customerName: isQuote ? faker.person.fullName() : null,

                        emailSlug: faker.string.uuid(), // simplified
                        formPayloadJson: '{}',
                        assigneeId: assignee?.id,
                        opdsl: faker.date.future(),
                        createdAt: faker.date.past(),

                        // Relations
                        // Create some notes and emails inline? Prisma supports this but might be slow.
                        // Let's do it simply.
                        notes: {
                            create: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }).map(() => ({
                                content: faker.lorem.paragraph(),
                                authorId: faker.helpers.arrayElement(users).id
                            }))
                        }
                    }
                }));
            }
            await prisma.$transaction(requests);
            if (batch % 5 === 0) console.log(`  - Board ${board.name}: Created ${batch * batchSize} / ${CONFIG.casesPerBoard} cases`);
        }
    }

    const duration = (Date.now() - start) / 1000;
    console.log(`✅ Heavy seed complete in ${duration}s`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
