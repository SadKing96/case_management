
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding...');

    /*
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
    */

    // 5. Create Aftermarket Assets
    console.log('Seeding Aftermarket Assets...');
    const assetsData = [
        {
            serialNumber: 'SN-XRT-5001',
            model: 'Valve-XRT-5000',
            customerName: 'Acme Corp',
            location: 'Plant A, Sector 7',
            installDate: new Date('2023-01-15'),
            status: 'Active',
            healthScore: 92,
            revenuePotential: 0
        },
        {
            serialNumber: 'SN-XRT-5044',
            model: 'Valve-XRT-5000',
            customerName: 'Acme Corp',
            location: 'Plant A, Sector 8',
            installDate: new Date('2022-05-20'),
            status: 'Maintenance Required',
            healthScore: 65,
            revenuePotential: 5000,
            aiPrediction: 'Seal degradation detected'
        },
        {
            serialNumber: 'SN-TUR-9000',
            model: 'Turbine-9000X',
            customerName: 'Globex Inc',
            location: 'Offshore Platform',
            installDate: new Date('2021-11-01'),
            status: 'Critical',
            healthScore: 30,
            revenuePotential: 25000,
            aiPrediction: 'Vibration anomaly - bearing failure imminent'
        },
        {
            serialNumber: 'SN-PUMP-202',
            model: 'Pump-Max-200',
            customerName: 'Soylent Corp',
            location: 'Refinery Main',
            installDate: new Date('2023-06-10'),
            status: 'Services Due',
            healthScore: 75,
            revenuePotential: 2500,
            aiPrediction: 'Routine service interval approaching'
        },
        {
            serialNumber: 'SN-CTRL-88',
            model: 'Controller-V8',
            customerName: 'Initech',
            location: 'Server Room',
            installDate: new Date('2024-01-01'),
            status: 'Active',
            healthScore: 98,
            revenuePotential: 0
        }
    ];

    for (const asset of assetsData) {
        await prisma.aftermarketAsset.upsert({
            where: { serialNumber: asset.serialNumber },
            update: {},
            create: asset
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
