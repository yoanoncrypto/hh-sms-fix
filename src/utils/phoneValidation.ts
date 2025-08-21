export const normalizePhoneNumber = (phone: string): string => {
  // Accept only digits and +, space, -, ., ()
  const validCharPattern = /^[\d\+\s\-\.\(\)]+$/;
  if (!validCharPattern.test(phone)) {
    return phone;
  }

  // Strip all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  // International format without +: should be exactly 12 digits for BG mobiles (3598xxxxxxx)
  if (digitsOnly.length === 12 && digitsOnly.startsWith('3598')) {
    return `+${digitsOnly}`;
  }

  // Local format starting with 0 and total 10 digits (08x xxxxxxx)
  if (digitsOnly.length === 10 && digitsOnly.startsWith('08')) {
    return `+359${digitsOnly.slice(1)}`;
  }

  // Mobile without leading zero (9 digits starting with 8 or 9)
  if (digitsOnly.length === 9 && /^[89]/.test(digitsOnly)) {
    return `+359${digitsOnly}`;
  }

  // If already an international other number (10-15 digits)
  if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
    return `+${digitsOnly}`;
  }

  // Unable to normalize: return original
  return phone;
};

export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;

  // Accept only digits and +, space, -, ., ()
  const validCharPattern = /^[\d\+\s\-\.\(\)]+$/;
  if (!validCharPattern.test(phone.trim())) {
    return false;
  }

  // Normalize and test E.164 pattern
  const normalized = normalizePhoneNumber(phone);
  if (!/^\+\d{10,15}$/.test(normalized)) {
    return false;
  }

  // Country detection
  return detectCountryFromPhone(normalized) !== null;
};

export const detectCountryFromPhone = (phone: string): string | null => {
  if (!phone || typeof phone !== 'string') return null;

  const normalized = normalizePhoneNumber(phone);
  if (!/^\+\d+$/.test(normalized)) return null;

  const prefixes: { [prefix: string]: string } = {
    '+359': 'BG', 
    '+380': 'UA', 
    '+48': 'PL', 
    '+40': 'RO', 
    '+36': 'HU',
    '+420': 'CZ', '+421': 'SK', '+385': 'HR', '+386': 'SI', '+381': 'RS',
    '+49': 'DE', '+33': 'FR', '+39': 'IT', '+34': 'ES', '+31': 'NL',
    '+32': 'BE', '+43': 'AT', '+41': 'CH', '+44': 'GB', '+1': 'US'
  };

  for (const [pfx, country] of Object.entries(prefixes)) {
    if (normalized.startsWith(pfx)) {
      if (pfx === '+359') {
        // Bulgarian numbers: +359 + 8-9 digits (mobile and landline)
        // Mobile: +3598xxxxxxx or +3599xxxxxxx (9 digits after +359)
        // Landline: +3592xxxxxxx, +35932xxxxxx, etc. (8-9 digits after +359)
        if (/^\+359[2-9]\d{7,8}$/.test(normalized)) {
          return country;
        }
      } else {
        return country;
      }
    }
  }

  return null;
};
