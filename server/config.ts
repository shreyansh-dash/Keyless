export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  RP_NAME: 'National Digital Identity Grid (DigiLocker)',
  // RP_ID represents the relying party domain. In local development it is 'localhost'.
  RP_ID: process.env.RP_ID || 'localhost',
  EXPECTED_ORIGIN: process.env.EXPECTED_ORIGIN || ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://id.digilocker.gov.in'],
  OFFICIAL_ORIGIN: 'https://id.digilocker.gov.in',
  PHISHING_ROUTER_ORIGIN: 'https://id.digil0cker-gov.in',
  CHALLENGE_TIMEOUT_MS: 60000,
  SESSION_SECRET: 'cybercup-national-identity-passkey-keyless-2026',
};
