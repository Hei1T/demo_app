import { randomBytes } from 'node:crypto';

/**
 * 短码生成：10 位 base32（去掉 I/L/O/0/1 等易混字符）
 * 32^10 ≈ 1.13e15 —— 不可枚举、不可猜测
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LEN = 10;

export function generateCode(len = CODE_LEN): string {
  const bytes = randomBytes(len * 2);
  let out = '';
  let i = 0;
  while (out.length < len && i < bytes.length) {
    const b = bytes[i++];
    // 拒绝采样，避免取模偏差
    if (b >= 256 - (256 % ALPHABET.length)) continue;
    out += ALPHABET[b % ALPHABET.length];
  }
  if (out.length < len) return generateCode(len);
  return out;
}

/** 完整短链：SHORT_BASE_URL + /code */
export function shortUrl(code: string): string {
  const base = (process.env.SHORT_BASE_URL ?? 'http://localhost:3000/u').replace(
    /\/+$/,
    '',
  );
  return `${base}/${code}`;
}
