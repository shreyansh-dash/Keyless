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

// Voice synthesizer for Inclusivity (Speaks in Hindi or English)
export function speakAcousticChallenge(code: string, lang: 'hi-IN' | 'en-IN' = 'en-IN') {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const formattedCode = code.split('').join(' . ');
  const promptText = lang === 'hi-IN' 
    ? `सुरक्षित सत्यापन कोड है: ${formattedCode}. कृपया अपने बायोमेट्रिक सेंसर को स्पर्श करें.`
    : `Secure identity verification code: ${formattedCode}. Please tap your biometric sensor.`;

  const utterance = new SpeechSynthesisUtterance(promptText);
  utterance.lang = lang;
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}
