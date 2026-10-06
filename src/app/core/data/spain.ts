import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Provincias de España (código INE = 2 primeros dígitos del código postal).
 * Debe coincidir con backend/app/utils/spain.py.
 */
export interface Province { code: string; name: string; peninsular: boolean; }

const RAW: [string, string][] = [
  ['01', 'Álava'], ['02', 'Albacete'], ['03', 'Alicante'], ['04', 'Almería'], ['05', 'Ávila'],
  ['06', 'Badajoz'], ['07', 'Baleares'], ['08', 'Barcelona'], ['09', 'Burgos'], ['10', 'Cáceres'],
  ['11', 'Cádiz'], ['12', 'Castellón'], ['13', 'Ciudad Real'], ['14', 'Córdoba'], ['15', 'A Coruña'],
  ['16', 'Cuenca'], ['17', 'Girona'], ['18', 'Granada'], ['19', 'Guadalajara'], ['20', 'Gipuzkoa'],
  ['21', 'Huelva'], ['22', 'Huesca'], ['23', 'Jaén'], ['24', 'León'], ['25', 'Lleida'],
  ['26', 'La Rioja'], ['27', 'Lugo'], ['28', 'Madrid'], ['29', 'Málaga'], ['30', 'Murcia'],
  ['31', 'Navarra'], ['32', 'Ourense'], ['33', 'Asturias'], ['34', 'Palencia'], ['35', 'Las Palmas'],
  ['36', 'Pontevedra'], ['37', 'Salamanca'], ['38', 'Santa Cruz de Tenerife'], ['39', 'Cantabria'],
  ['40', 'Segovia'], ['41', 'Sevilla'], ['42', 'Soria'], ['43', 'Tarragona'], ['44', 'Teruel'],
  ['45', 'Toledo'], ['46', 'Valencia'], ['47', 'Valladolid'], ['48', 'Bizkaia'], ['49', 'Zamora'],
  ['50', 'Zaragoza'], ['51', 'Ceuta'], ['52', 'Melilla'],
];
const NON_PENINSULAR = new Set(['07', '35', '38', '51', '52']);

const collator = new Intl.Collator('es');
export const PROVINCES: Province[] = RAW
  .map(([code, name]) => ({ code, name, peninsular: !NON_PENINSULAR.has(code) }))
  .sort((a, b) => collator.compare(a.name, b.name));

/** Provincias a las que se envía (las condiciones de venta limitan los envíos a la península). */
export const SHIPPING_PROVINCES = PROVINCES.filter(p => p.peninsular);

export function provinceCode(name: string | null | undefined): string | null {
  const n = (name ?? '').trim().toLowerCase();
  return PROVINCES.find(p => p.name.toLowerCase() === n)?.code ?? null;
}

/** Nombre oficial de la provincia (si existe) para un texto libre antiguo, o null. */
export function canonicalProvince(name: string | null | undefined): string | null {
  const code = provinceCode(name);
  return code ? RAW.find(([c]) => c === code)![1] : null;
}

/** Nombre oficial de la provincia de un código postal ("13005" → "Ciudad Real"). */
export function provinceFromPostcode(cp: string | null | undefined): string | null {
  const code = (cp ?? '').trim().slice(0, 2);
  return RAW.find(([c]) => c === code)?.[1] ?? null;
}

/**
 * Validador de grupo: el código postal debe corresponder a la provincia
 * seleccionada (los 2 primeros dígitos del CP son el código de la provincia).
 * Marca el error `provinceMismatch` en el control del código postal.
 */
export function postcodeMatchesProvince(provinceKey: string, postcodeKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const province = group.get(provinceKey)?.value;
    const cpControl = group.get(postcodeKey);
    if (!cpControl) return null;
    const cp = String(cpControl.value ?? '').trim();
    const errors = { ...(cpControl.errors ?? {}) };
    const mismatch = !!province && /^\d{5}$/.test(cp) && provinceCode(province) !== cp.slice(0, 2);
    if (mismatch === !!errors['provinceMismatch']) return null;
    if (mismatch) errors['provinceMismatch'] = true;
    else delete errors['provinceMismatch'];
    cpControl.setErrors(Object.keys(errors).length ? errors : null);
    return null;
  };
}

/** Prefijos telefónicos ofrecidos (España por defecto). */
export const PHONE_PREFIXES = [
  { code: '+34', label: '🇪🇸 +34' },
  { code: '+351', label: '🇵🇹 +351' },
  { code: '+33', label: '🇫🇷 +33' },
  { code: '+39', label: '🇮🇹 +39' },
  { code: '+49', label: '🇩🇪 +49' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+1', label: '🇺🇸 +1' },
];
