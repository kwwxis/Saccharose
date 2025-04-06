import crypto from 'crypto';

export function sha1(input: string): string {
  return crypto.createHash('sha1').update(input).digest('hex')
}

export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

export function sha384(input: string): string {
  return crypto.createHash('sha384').update(input).digest('hex')
}

export function sha512(input: string): string {
  return crypto.createHash('sha512').update(input).digest('hex')
}
