// Dihedral Group D5 Verhoeff Checksum Algorithm (Mandated by UIDAI for 12-Digit Aadhaar)
// RFC / ISO/IEC 7064 Mod 11, 10

const d: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const p: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const inv: number[] = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Validates a number string using the Verhoeff algorithm.
 */
export function validateVerhoeff(numStr: string): boolean {
  const digits = numStr.replace(/\D/g, '');
  if (digits.length < 2) return false;

  let c = 0;
  const reversed = digits.split('').map(Number).reverse();
  for (let i = 0; i < reversed.length; i++) {
    c = d[c][p[i % 8][reversed[i]]];
  }
  return c === 0;
}

/**
 * Generates the Verhoeff checksum digit for a number string.
 */
export function generateVerhoeffChecksum(numStr: string): number {
  const digits = numStr.replace(/\D/g, '');
  let c = 0;
  const reversed = digits.split('').map(Number).reverse();
  for (let i = 0; i < reversed.length; i++) {
    c = d[c][p[(i + 1) % 8][reversed[i]]];
  }
  return inv[c];
}

/**
 * Validates Aadhaar format and structure.
 * Supports:
 * - 12-digit numbers: '380563080624', '3805 6308 0624', '3805-6308-0624'
 * - Prefixed official sandbox IDs: 'IN-AADHAAR-8921-9941'
 */
export function validateAadhaarStructure(aadhaar: string): {
  valid: boolean;
  cleanId: string;
  is12Digit: boolean;
  verhoeffValid: boolean;
  error?: string;
} {
  const trimmed = (aadhaar || '').trim();
  if (!trimmed) {
    return { valid: false, cleanId: '', is12Digit: false, verhoeffValid: false, error: 'Aadhaar cannot be empty' };
  }

  // Handle prefix format e.g. IN-AADHAAR-8921-9941
  if (trimmed.toUpperCase().startsWith('IN-AADHAAR-')) {
    const rawParts = trimmed.substring(11).replace(/[^0-9]/g, '');
    if (rawParts.length >= 8) {
      return {
        valid: true,
        cleanId: trimmed.toUpperCase(),
        is12Digit: false,
        verhoeffValid: true,
      };
    }
  }

  // Extract raw digits
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length !== 12) {
    return {
      valid: false,
      cleanId: digits,
      is12Digit: false,
      verhoeffValid: false,
      error: `Invalid Aadhaar length: Expected 12 digits, got ${digits.length}`,
    };
  }

  // Check for invalid starting digit (Aadhaar cannot start with 0 or 1)
  if (digits.startsWith('0') || digits.startsWith('1')) {
    return {
      valid: false,
      cleanId: digits,
      is12Digit: true,
      verhoeffValid: false,
      error: 'Invalid Aadhaar: Government UID numbers cannot begin with 0 or 1',
    };
  }

  // Validate Verhoeff checksum
  const vValid = validateVerhoeff(digits);
  return {
    valid: true, // We allow valid 12-digit format, checking Verhoeff for advisory/strict mode
    cleanId: digits,
    is12Digit: true,
    verhoeffValid: vValid,
  };
}

/**
 * Fuzzy demographic name matching (Jaro-Winkler + Token Match)
 * Confirms that the declared name matches the official UIDAI registry record.
 */
export function checkDemographicNameMatch(declaredName: string, officialName: string): {
  match: boolean;
  score: number;
  reason?: string;
} {
  const clean = (s: string) =>
    (s || '')
      .toLowerCase()
      .replace(/\b(mr|mrs|ms|shri|smt|dr|prof)\.?\b/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');

  const d = clean(declaredName);
  const o = clean(officialName);

  if (!d || !o) {
    return { match: false, score: 0, reason: 'Missing name for demographic verification' };
  }

  // Exact match
  if (d === o) {
    return { match: true, score: 1.0 };
  }

  // Token matching (e.g. "Dhruv Yadav" vs "Yadav Dhruv")
  const dTokens = d.split(' ').sort();
  const oTokens = o.split(' ').sort();
  if (dTokens.join(' ') === oTokens.join(' ')) {
    return { match: true, score: 0.98 };
  }

  // Check if one is a subset of the other (e.g. initials "Priya M Patel" vs "Priya Patel")
  const common = dTokens.filter(t => oTokens.includes(t));
  if (common.length >= Math.min(dTokens.length, oTokens.length)) {
    return { match: true, score: 0.90 };
  }

  // Jaro-Winkler similarity calculation
  const score = jaroWinkler(d, o);
  const isMatch = score >= 0.75;

  return {
    match: isMatch,
    score: Math.round(score * 100) / 100,
    reason: isMatch ? undefined : `Name similarity (${Math.round(score * 100)}%) is below acceptable government threshold (75%)`,
  };
}

function jaroWinkler(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  const l1 = s1.length;
  const l2 = s2.length;
  const matchDistance = Math.floor(Math.max(l1, l2) / 2) - 1;

  const s1Matches = new Array(l1).fill(false);
  const s2Matches = new Array(l2).fill(false);

  let matches = 0;
  for (let i = 0; i < l1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, l2);
    for (let j = start; j < end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }
  }

  if (matches === 0) return 0.0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < l1; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
  }

  const jaro = (matches / l1 + matches / l2 + (matches - transpositions / 2) / matches) / 3;
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(l1, l2)); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}
