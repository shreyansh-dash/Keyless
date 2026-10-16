// Cryptographic Engine for FIDO2/WebAuthn Telemetry & Simulation

export function bufferToBase64URL(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function base64URLToBuffer(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate cryptographic secure random challenge (32 bytes entropy)
export function generateChallenge(bytesCount = 32): { raw: Uint8Array; base64url: string; hex: string } {
  const raw = new Uint8Array(bytesCount);
  window.crypto.getRandomValues(raw);
  return {
    raw,
    base64url: bufferToBase64URL(raw),
    hex: bufferToHex(raw),
  };
}

// SHA-256 via WebCrypto SubtleCrypto
export async function sha256(input: string | Uint8Array): Promise<{ hex: string; raw: Uint8Array }> {
  const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data as BufferSource);
  const raw = new Uint8Array(hashBuffer);
  return {
    hex: bufferToHex(raw),
    raw,
  };
}

// Inspect and parse WebAuthn Authenticator Data (37+ bytes)
export function parseAuthenticatorData(authData: Uint8Array) {
  if (authData.length < 37) {
    throw new Error('Authenticator data too short (< 37 bytes)');
  }
  const rpIdHash = bufferToHex(authData.slice(0, 32));
  const flagsByte = authData[32];
  const signCount = (authData[33] << 24) | (authData[34] << 16) | (authData[35] << 8) | authData[36];

  const userPresent = !!(flagsByte & 0x01); // Bit 0: UP
  const userVerified = !!(flagsByte & 0x04); // Bit 2: UV
  const backupEligibility = !!(flagsByte & 0x08); // Bit 3: BE
  const backupState = !!(flagsByte & 0x10); // Bit 4: BS
  const attestedCredentialData = !!(flagsByte & 0x40); // Bit 6: AT
  const extensionDataIncluded = !!(flagsByte & 0x80); // Bit 7: ED

  return {
    rpIdHash,
    flagsByte,
    flagsBinary: '0b' + flagsByte.toString(2).padStart(8, '0'),
    flags: {
      userPresent,
      userVerified,
      backupEligibility,
      backupState,
      attestedCredentialData,
      extensionDataIncluded,
    },
    signCount,
    rawHex: bufferToHex(authData),
  };
}

// Create synthetic WebAuthn AuthenticatorData buffer with specified flags
export async function createSyntheticAuthData(rpId: string, flags: { userPresent?: boolean; userVerified?: boolean } = {}): Promise<Uint8Array> {
  const rpIdHashObj = await sha256(rpId);
  const rpIdHash = rpIdHashObj.raw;
  const buffer = new Uint8Array(37);
  buffer.set(rpIdHash, 0);

  let flagsByte = 0;
  if (flags.userPresent ?? true) flagsByte |= 0x01; // UP
  if (flags.userVerified ?? true) flagsByte |= 0x04; // UV
  flagsByte |= 0x08; // BE (Backup eligible)
  flagsByte |= 0x10; // BS (Backup state)

  buffer[32] = flagsByte;
  // Sign count: random 32-bit counter
  const counter = Math.floor(Math.random() * 1000) + 120;
  buffer[33] = (counter >> 24) & 0xff;
  buffer[34] = (counter >> 16) & 0xff;
  buffer[35] = (counter >> 8) & 0xff;
  buffer[36] = counter & 0xff;

  return buffer;
}

// Generate realistic P-256 ECDSA keypair using WebCrypto for authentic cryptographic assertion
export async function generateCryptoKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify']
  );
}

// Sign data using ECDSA P-256
export async function signWithKey(privateKey: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
  const signature = await window.crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    privateKey,
    data as BufferSource
  );
  return new Uint8Array(signature);
}

// Voice synthesizer for Inclusivity (Speaks in Hindi, English, Tamil, Bengali, Telugu)
export type SupportedVoiceLang = 'en-IN' | 'hi-IN' | 'ta-IN' | 'bn-IN' | 'te-IN';

export function speakAcousticChallenge(code: string, lang: SupportedVoiceLang = 'en-IN') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const formattedCode = code.split('').join(' . ');
  let promptText = `Secure identity verification code: ${formattedCode}. Please tap your biometric sensor.`;

  if (lang === 'hi-IN') {
    promptText = `सुरक्षित सत्यापन कोड है: ${formattedCode}. कृपया अपने बायोमेट्रिक सेंसर को स्पर्श करें.`;
  } else if (lang === 'ta-IN') {
    promptText = `பாதுகாப்பான சரிபார்ப்புக் குறியீடு: ${formattedCode}. உங்கள் பயோமெட்ரிக் சென்சாரைத் தொடவும்.`;
  } else if (lang === 'bn-IN') {
    promptText = `নিরাপদ যাচাইকরণ কোড হলো: ${formattedCode}. অনুগ্রহ করে আপনার বায়ोমেট্রিক সেন্সর স্পর্শ করুন.`;
  } else if (lang === 'te-IN') {
    promptText = `సురక్షిత ధృవీకరణ కోడ్: ${formattedCode}. దయచేసి మీ బయోమెట్రిక్ సెన్సార్‌ను తాకండి.`;
  }

  const utterance = new SpeechSynthesisUtterance(promptText);
  utterance.lang = lang;
  utterance.rate = 0.85;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

export function speakVoiceGuide(text: string, lang: SupportedVoiceLang = 'hi-IN') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

// Dihedral Group D5 Verhoeff Checksum Algorithm
const verhoeff_d: number[][] = [
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

const verhoeff_p: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function validateVerhoeffChecksum(numStr: string): boolean {
  const digits = numStr.replace(/\D/g, '');
  if (digits.length < 2) return false;
  let c = 0;
  const reversed = digits.split('').map(Number).reverse();
  for (let i = 0; i < reversed.length; i++) {
    c = verhoeff_d[c][verhoeff_p[i % 8][reversed[i]]];
  }
  return c === 0;
}

export function validateAadhaarInput(val: string): { valid: boolean; message: string; is12Digit: boolean } {
  const trimmed = (val || '').trim();
  if (!trimmed) return { valid: false, message: 'Please enter your Aadhaar number', is12Digit: false };
  if (trimmed.toUpperCase().startsWith('IN-AADHAAR-')) {
    return { valid: true, message: 'Valid Sandbox National ID', is12Digit: false };
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length !== 12) {
    return { valid: false, message: `Aadhaar must be exactly 12 digits (currently ${digits.length})`, is12Digit: false };
  }
  if (digits.startsWith('0') || digits.startsWith('1')) {
    return { valid: false, message: 'Invalid Aadhaar: Cannot start with 0 or 1', is12Digit: true };
  }
  const vValid = validateVerhoeffChecksum(digits);
  return {
    valid: true,
    message: vValid ? '✓ Valid 12-Digit Verhoeff Checksum' : '12-Digit Aadhaar format (Mock Sandbox Check)',
    is12Digit: true,
  };
}
