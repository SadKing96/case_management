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
    let JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('FATAL: JWT_SECRET is not defined in production environment.');
        } else {
            console.warn('SECURITY WARNING: Using default "dev-secret-key" for JWT_SECRET.');
            JWT_SECRET = 'dev-secret-key';
        }
    }

    // Try Local JWT first
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        return next();
    } catch (err) {
        // Not a local token, try Azure AD if configured, or just mock headers
    }

    if (process.env.NODE_ENV !== 'production' && token === 'mock-token') {
        req.user = {
            id: 'u1',
            name: 'Mock User',
            email: 'walter@example.com',
            roles: ['SuperUser', 'Admin'],
            workspaceId: 'default-workspace'
        };
        return next();
    }

    if (process.env.NODE_ENV !== 'production' && token === 'mock-client-token') {
        req.user = {
            id: 'client-123',
            name: 'Acme Corp',
            email: 'buyer@acme.com',
            roles: ['Client'],
            workspaceId: 'default-workspace'
        };
        return next();
    }

    // Azure AD Fallback
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
