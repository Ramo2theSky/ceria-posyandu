export function maskNIK(nik: string): string {
  if (nik.length <= 8) return nik;

  const prefix = nik.slice(0, 4);
  const suffix = nik.slice(-4);
  const maskedLength = Math.max(nik.length - 8, 4);

  return `${prefix}${'*'.repeat(maskedLength)}${suffix}`;
}