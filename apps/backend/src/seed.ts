
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
        where: { id: 'default' },
        update: {},
        create: {
            id: 'default',
            name: 'Main Board',
            slug: 'default',
            workspaceId: workspace.id
        }
    });

    // 3. Create Columns
    const columns = ['New Request', 'In Progress', 'For Review', 'Done'];
    for (let i = 0; i < columns.length; i++) {
        await prisma.column.create({
            data: {
                boardId: board.id,
                name: columns[i],
                position: i
            }
        });
    }

    // 4. Create Users
    await prisma.user.upsert({
        where: { email: 'walter@example.com' },
        update: {},
        create: {
            id: 'u1',
            email: 'walter@example.com',
            name: 'Walter White',
            roles: 'Admin'
        }
    });

    await prisma.user.upsert({
        where: { email: 'jesse@example.com' },
        update: {},
        create: {
            id: 'u2',
            email: 'jesse@example.com',
            name: 'Jesse Pinkman',
            roles: 'User'
        }
    });

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
