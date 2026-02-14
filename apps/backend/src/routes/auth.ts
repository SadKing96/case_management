import { Router } from 'express';
import { prisma } from '../db/prisma';
import { verifyPassword } from '../utils/auth';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body; // Accept email or username

        // Find user by email or name (acting as username)
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { name: email }
                ]
            }
        });

        if (!user) {
            return res.status(401).json({ error: { message: 'Invalid credentials' } });
        }

        const isValid = await verifyPassword(password, user.password);

        if (!isValid) {
            return res.status(401).json({ error: { message: 'Invalid credentials' } });
        }

        if (!user.isActive) {
            return res.status(403).json({ error: { message: 'Account is deactivated' } });
        }

        // Generate Token
        // roles is stored as "Role1,Role2" string
        const roles = user.roles.split(',');

        const tokenPayload = {
            id: user.id,
            name: user.name,
            email: user.email,
            roles: roles,
            workspaceId: 'default-workspace'
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                roles: roles
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: { message: 'Internal server error' } });
    }
});

export default router;
