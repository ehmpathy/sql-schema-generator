import crypto from 'crypto';

/**
 * hashes a string w/ shake256, which allows for custom length hashes
 *
 * usecases
 * - custom sized hashing, when you want to control length at the cost of collision-probability
 *
 * note
 * - sync version is only available in node env
 *
 * ref
 * - https://stackoverflow.com/a/67073856/3068233
 */
export const toHashShake256Sync = (data: string, length: 2 | 4 | 8 | 16 | 32) =>
  crypto
    .createHash('shake256', { outputLength: length })
    .update(data)
    .digest('hex');
