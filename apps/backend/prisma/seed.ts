import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding...');

    // 1. Create Workspace
    const workspace = await prisma.workspace.upsert({
        where: { id: 'default-workspace' },
        update: {},
        create: {
            id: 'default-workspace',
            name: 'Default Workspace',
            domain: 'demo.local'
        }
    });

    // 2. Create Board
    const board = await prisma.board.upsert({
        where: { slug: 'default' },
        update: {},
        create: {
            id: 'default-board',
            name: 'Main Board',
            slug: 'default',
            workspaceId: workspace.id
        }
    });

    // 3. Create Users
    const user1 = await prisma.user.upsert({
        where: { email: 'walter@example.com' },
        update: {},
        create: {
            id: 'u1',
            email: 'walter@example.com',
            name: 'Walter White',
            roles: 'Admin'
        }
    });

    const user2 = await prisma.user.upsert({
        where: { email: 'jesse@example.com' },
        update: {},
        create: {
            id: 'u2',
            email: 'jesse@example.com',
            name: 'Jesse Pinkman',
            roles: 'User'
        }
    });

    // 4. Create Columns
    const colDefs = [
        { name: 'New Request', position: 0, color: '#3b82f6' },
        { name: 'In Progress', position: 1, color: '#f59e0b' },
        { name: 'For Review', position: 2, color: '#8b5cf6' },
        { name: 'Done', position: 3, color: '#10b981', isFinal: true }
    ];

    const columns = [];

    for (const def of colDefs) {
        const existing = await prisma.column.findFirst({
            where: { boardId: board.id, name: def.name }
        });

        if (existing) {
            columns.push(existing);
        } else {
            const col = await prisma.column.create({
                data: {
                    boardId: board.id,
                    name: def.name,
                    position: def.position,
                    isFinal: def.isFinal || false
                }
            });
            columns.push(col);
        }
    }

    // 5. Create Cases
    const count = await prisma.case.count({ where: { boardId: board.id } });
    if (count === 0) {
        // Use any for formPayloadJson to avoid strict typing issues if using raw JSON
        const payload = '{}';

        await prisma.case.create({
            data: {
                boardId: board.id,
                columnId: columns[0].id,
                position: 0,
                title: 'Educational webinar about our product',
                priority: 'High',
                assigneeId: user1.id,
                opdsl: new Date('2024-04-24'),
                formPayloadJson: payload,
                caseType: 'ORDER'
            }
        });

        await prisma.case.create({
            data: {
                boardId: board.id,
                columnId: columns[1].id,
                position: 0,
                title: 'Media press kit',
                priority: 'Medium',
                assigneeId: user2.id,
                opdsl: new Date('2024-04-11'),
                formPayloadJson: payload,
                caseType: 'ORDER'
            }
        });
    }

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
