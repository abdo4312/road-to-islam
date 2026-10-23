// ── WhatsApp number utilities — مستخرجة من FindMentor (P5 move-exact) ──

export const COUNTRY_DIAL_CODES: Record<string, string> = {
  EG: '20',
  SA: '966',
  MA: '212',
  DZ: '213',
  TN: '216',
  TR: '90',
  PK: '92',
  NG: '234',
  ID: '62',
  MY: '60',
  SN: '221',
};

export const COUNTRY_NAME_TO_CODE: Record<string, keyof typeof COUNTRY_DIAL_CODES> = {
  EGYPT: 'EG',
  'SAUDI ARABIA': 'SA',
  MOROCCO: 'MA',
  ALGERIA: 'DZ',
  TUNISIA: 'TN',
  TURKEY: 'TR',
  PAKISTAN: 'PK',
  NIGERIA: 'NG',
  INDONESIA: 'ID',
  MALAYSIA: 'MY',
  SENEGAL: 'SN',
};

export const resolveDialCode = (country: string): string | null => {
  const normalized = country.trim().toUpperCase();
  const countryCode = COUNTRY_NAME_TO_CODE[normalized] || (normalized as keyof typeof COUNTRY_DIAL_CODES);
  return COUNTRY_DIAL_CODES[countryCode] || null;
};

export const formatWhatsAppNumber = (rawNumber: string, countryCode: string): string | null => {
  const trimmed = rawNumber.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (!digitsOnly) return null;

  // If number already contains international prefix (+), keep digits as-is.
  if (trimmed.startsWith('+')) return digitsOnly;

  const dialCode = resolveDialCode(countryCode);
  if (digitsOnly.startsWith('0')) {
    if (!dialCode) return null;
    const localNumber = digitsOnly.replace(/^0+/, '');
    return localNumber ? `${dialCode}${localNumber}` : null;
  }

  // If number already starts with country code, keep it as-is.
  if (dialCode && digitsOnly.startsWith(dialCode)) return digitsOnly;

  return digitsOnly;
};
