import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const deriveKey = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = (await deriveKey(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(password: string, hash?: string): Promise<boolean> {
  const [, salt = '00000000000000000000000000000000', hex = ''] = (hash ?? '').split(':');
  const expected = Buffer.from(hex, 'hex');
  const key = (await deriveKey(password, salt, 64)) as Buffer;
  return expected.length === key.length && timingSafeEqual(expected, key);
}
