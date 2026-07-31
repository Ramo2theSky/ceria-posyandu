import { describe, it, expect } from 'vitest';
import { maskNIK } from '../formatters';

describe('maskNIK', () => {
  it('mask NIK 16 digit — tampilkan 4 awal + 4 akhir', () => {
    expect(maskNIK('3309123456780001')).toBe('3309********0001');
  });

  it('NIK pendek tetap ditampilkan utuh', () => {
    expect(maskNIK('12345678')).toBe('12345678');
  });

  it('NIK 8 karakter tidak di-mask', () => {
    expect(maskNIK('12345678')).toBe('12345678');
  });

  it('NIK 12 digit — mask 4 karakter', () => {
    expect(maskNIK('123456789012')).toBe('1234****9012');
  });
});
