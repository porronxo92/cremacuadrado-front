import { AbstractControl, ValidationErrors } from '@angular/forms';

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

export function normalizeTaxId(value: string): string {
  return (value || '').replace(/[\s\-.]/g, '').toUpperCase();
}

/** Spanish NIF / NIE / CIF with check digit (mirrors backend app/utils/tax_id.py). */
export function isValidTaxId(value: string): boolean {
  const id = normalizeTaxId(value);
  let m = id.match(/^(\d{8})([A-Z])$/);
  if (m) return DNI_LETTERS[Number(m[1]) % 23] === m[2];
  m = id.match(/^([XYZ])(\d{7})([A-Z])$/);
  if (m) return DNI_LETTERS[('XYZ'.indexOf(m[1]) * 10_000_000 + Number(m[2])) % 23] === m[3];
  m = id.match(/^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/);
  if (!m) return false;
  const [, letter, digits, control] = m;
  let even = 0;
  let odd = 0;
  for (let i = 0; i < 7; i++) {
    const d = Number(digits[i]);
    if (i % 2 === 1) even += d;
    else { const x = d * 2; odd += Math.floor(x / 10) + (x % 10); }
  }
  const check = (10 - ((even + odd) % 10)) % 10;
  const checkLetter = 'JABCDEFGHI'[check];
  if ('PQRSNW'.includes(letter)) return control === checkLetter;
  if ('ABEH'.includes(letter)) return control === String(check);
  return control === String(check) || control === checkLetter;
}

export function taxIdValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null; // `required` handles empty values
  return isValidTaxId(value) ? null : { taxId: true };
}
