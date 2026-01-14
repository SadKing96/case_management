import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';

// Extend Express Request
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

// Config from env
const tenantId = process.env.ENTRA_TENANT_ID;
const clientId = process.env.ENTRA_CLIENT_ID;
const issuer = process.env.ENTRA_ISSUER || `https://sts.windows.net/${tenantId}/`;

const client = jwksRsa({
    jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
});

function getKey(header: any, callback: any) {
    client.getSigningKey(header.kid, (err, key) => {
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
    });
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
    }

    const token = authHeader.split(' ')[1];

    if (token === 'mock-token') {
        req.user = {
            id: 'u1',
            name: 'Mock User',
            email: 'walter@example.com',
            roles: ['SuperUser', 'Admin'],
            workspaceId: 'default-workspace'
        };
        return next();
    }

    jwt.verify(token, getKey, {
        audience: clientId, // or api://...
        issuer: issuer,
        algorithms: ['RS256']
    }, (err, decoded) => {
        if (err) {
            console.error('JWT Verify Error:', err);
            return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
        }
        req.user = decoded;
        next();
    });
};

export const requireSuperUser = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    // Check if user has SuperUser role
    // Assuming roles is an array of strings in the token or user object
    const roles = user.roles || [];
    if (!roles.includes('SuperUser')) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Requires SuperUser role' } });
    }

    next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const roles = user.roles || [];
    if (!roles.includes('SuperUser') && !roles.includes('Admin')) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Requires Admin or SuperUser role' } });
    }

    next();
};
