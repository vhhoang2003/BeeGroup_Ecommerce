import { describe, it, expect } from 'vitest';
import { passwordProblem } from '@/features/auth/passwordPolicy';
import { isLoopbackUrl } from '@/lib/utils';

describe('passwordProblem', () => {
  it('accepts 8-72 characters with a letter and a digit', () => {
    expect(passwordProblem('Beestore2026')).toBeNull();
  });

  it('rejects short, long, letter-only and digit-only passwords', () => {
    expect(passwordProblem('Ab1')).toMatch('8-72');
    expect(passwordProblem('a1'.repeat(37))).toMatch('8-72');
    expect(passwordProblem('onlyletters')).toMatch('chữ và số');
    expect(passwordProblem('1234567890')).toMatch('chữ và số');
  });

  it('rejects the email itself, ignoring case and spaces', () => {
    expect(passwordProblem('khach1@example.com', ' Khach1@Example.com ')).toMatch('trùng email');
  });
});

describe('isLoopbackUrl', () => {
  it('flags the local API, not the site or relative paths', () => {
    expect(isLoopbackUrl('http://localhost:8080/uploads/a.webp')).toBe(true);
    expect(isLoopbackUrl('http://127.0.0.1:8080/uploads/a.webp')).toBe(true);
    expect(isLoopbackUrl('https://beestore.vn/uploads/a.webp')).toBe(false);
    expect(isLoopbackUrl('/storage/CPU/a.jpg')).toBe(false);
  });
});
