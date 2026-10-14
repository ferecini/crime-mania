/** Digits-only CPF (11) or CNPJ (14). */
export function normalizeCpfCnpj(raw: string): string {
  return raw.replace(/\D/g, "");
}

function allSameDigits(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}

function isValidCpf(digits: string): boolean {
  if (digits.length !== 11 || allSameDigits(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(digits[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== Number(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(digits[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === Number(digits[10]);
}

function isValidCnpj(digits: string): boolean {
  if (digits.length !== 14 || allSameDigits(digits)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(digits[i]) * w1[i]!;
  let d1 = sum % 11;
  d1 = d1 < 2 ? 0 : 11 - d1;
  if (d1 !== Number(digits[12])) return false;
  sum = 0;
  for (let i = 0; i < 13; i++) sum += Number(digits[i]) * w2[i]!;
  let d2 = sum % 11;
  d2 = d2 < 2 ? 0 : 11 - d2;
  return d2 === Number(digits[13]);
}

export function isValidCpfCnpj(raw: string): boolean {
  const digits = normalizeCpfCnpj(raw);
  if (digits.length === 11) return isValidCpf(digits);
  if (digits.length === 14) return isValidCnpj(digits);
  return false;
}
