import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables');
}

const key = Buffer.from(ENCRYPTION_KEY, 'hex');

if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be a 64 character hex string (32 bytes)');
}

export function decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}