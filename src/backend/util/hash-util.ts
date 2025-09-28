import crypto, { BinaryLike } from 'crypto';

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

export function md5(input: BinaryLike): string {
  return crypto.createHash('md5').update(input).digest('hex')
}
