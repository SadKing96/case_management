import crypto from 'crypto';

export const hashPassword = (password: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(`${salt}:${derivedKey.toString('hex')}`);
        });
    });
};

export const verifyPassword = (password: string, hash: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const [salt, key] = hash.split(':');
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            const keyBuffer = Buffer.from(key, 'hex');
            // timingSafeEqual throws if lengths differ, so check first (constant time not strictly required for length check in this context as hash length is public knowledge/fixed, but good practice)
            if (keyBuffer.length !== derivedKey.length) {
                resolve(false);
                return;
            }
            resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
        });
    });
};
