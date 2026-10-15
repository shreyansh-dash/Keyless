# SECURE PASSKEY LOGIN // Next-Gen Passwordless Authentication Workstation
**Problem Statement Code:** CC6-IC04  
**Design Standard:** Swiss Clean Architecture (Zero Glassmorphism / Pure Matte / Hairline Grid / Geist Typography)  
**Framework:** Svelte 5 (Vite, TypeScript, Tailwind CSS v4, WebCrypto API)

---

## 1. Simple Overview
This project replaces vulnerable passwords and SMS OTPs with **Passkeys (FIDO2 / WebAuthn)** for Indian public services, rural village kiosks, and everyday citizens.

Every technical term in the UI has been given a **clear, everyday, human-understandable name**:

| Old Cryptographic Jargon | New Simple Name | Where It Is in the UI |
| :--- | :--- | :--- |
| `01. AUTH COCKPIT` | **`01. LOGIN DEMO`** | Top navigation tab 1 |
| `02. PHISHING DEFENSE LAB` | **`02. PHISHING TEST`** | Top navigation tab 2 |
| `03. NON-SMS RECOVERY` | **`03. ACCOUNT RECOVERY`** | Top navigation tab 3 |
| `04. INCLUSIVITY & KIOSK` | **`04. VILLAGE KIOSK & VOICE`** | Top navigation tab 4 |
| `05. DEVICE LEDGER & ADMIN` | **`05. MANAGE DEVICES`** | Top navigation tab 5 |
| `06. THREAT MODEL` | **`06. SECURITY REPORT`** | Top navigation tab 6 |
| `STRUCTURAL AUDIT GRID` | **`LIVE SECURITY LOG (BEHIND THE SCENES)`** | Left panel on the login screen |
| `AUTHENTICATE WITH PASSKEY` | **`LOG IN WITH FINGERPRINT / FACE ID`** | Large blue button on login card |
| `SIMULATE PHISHING ATTACK` | **`TEST A FAKE WEBSITE ATTACK`** | Red button on Phishing Test screen |
| `SIGN RECOVERY PERMIT` | **`APPROVE UNLOCK`** | Buttons on trusted helper cards |
| `12-Word Emergency Armor Key` | **`12-WORD EMERGENCY BACKUP PHRASE`** | Offline backup words screen |
| `SIMULATE OPERATOR PHONE SCAN` | **`SCAN QR CODE WITH PHONE`** | Village Kiosk screen button |
| `ACOUSTIC CHALLENGE` | **`SPOKEN VOICE CODE`** | Voice assistant for senior citizens |
| `REVOKE LOST DEVICE` | **`I LOST THIS DEVICE (BLOCK IT)`** | Manage Devices red button |

---

## 2. Directory Structure

```
c:/cybercup/
├── index.html                   # HTML entry point, Geist fonts, dark background
├── vite.config.ts               # Vite configuration with Tailwind CSS v4 & Svelte plugin
├── src/
│   ├── main.ts                  # Mounts App.svelte to document.getElementById('app')
│   ├── App.svelte               # Root view router (switches between active tabs)
│   ├── app.css                  # Clean Swiss tokens, hairpins, scrollbars, grid lines
│   └── lib/
│       ├── types.ts             # TypeScript data contracts
│       ├── cryptoEngine.ts      # WebCrypto random challenge, SHA-256, speech synthesis
│       ├── store.svelte.ts      # Reactive state ($state, $derived) and trigger actions
│       └── components/
│           ├── TopNav.svelte              # Top bar, assurance tag, tabs 01-06
│           ├── TelemetryStream.svelte     # Left-side live security log
│           ├── AuthCockpit.svelte         # Right-side login card
│           ├── PhishingLab.svelte         # Fake website test (real vs fake comparison)
│           ├── RecoveryEngine.svelte      # Trusted helpers (2 of 3) & 12-word backup
│           ├── InclusivityModule.svelte   # Village kiosk QR & Spoken voice code
│           ├── DeviceLedger.svelte        # Add/Block phones and security keys
│           └── ThreatModelDossier.svelte  # Plain-language security report
```

---

## 3. Every Screen and Button Explained

### Screen 1: `01. LOGIN DEMO` (`AuthCockpit.svelte` + `TelemetryStream.svelte`)
* **Left Side: `LIVE SECURITY LOG`**
  * `Dropdown (Filter)`: Shows `ALL STEPS`, `SECURITY CHALLENGE`, `WEBSITE CHECK`, `FINGERPRINT CHECK`, or `DIGITAL SIGNATURE`.
  * `DOWNLOAD LOG` button: Downloads the security event log as a JSON file.
  * `CLEAR` button: Clears the log window.
  * Clicking any log entry shows a popup window with the exact digital certificate and cryptographic data.
* **Right Side: `LOGIN SCREEN`**
  * `Choose How You Want To Log In`: Lets you select Apple Touch ID, YubiKey USB Key, or Google Pixel 8.
  * **`LOG IN WITH FINGERPRINT / FACE ID` (Large Blue Button):**
    * Starts the passkey login.
    * Shows `WAITING FOR YOUR TOUCH OR FACE...` while checking.
    * Shows `LOGGED IN SUCCESSFULLY` with a green `IDENTITY VERIFIED` tag when complete.
  * `TRY KIOSK / VOICE MODE →`: Quick link to village kiosk login.

---

### Screen 2: `02. PHISHING TEST` (`PhishingLab.svelte`)
* **`TEST A FAKE WEBSITE ATTACK` (Red Button):**
  * Runs a live simulated scammer attack.
  * Left Box: Shows the **Real Website** (`id.digilocker.gov.in`).
  * Right Box: Shows a **Fake Scam Website** (`id.digil0cker-gov.in` with a zero).
  * Shows how the browser catches the scam URL and displays: `✕ ATTACK BLOCKED: FAKE WEBSITE REJECTED`.

---

### Screen 3: `03. ACCOUNT RECOVERY` (`RecoveryEngine.svelte`)
* **Tab 1: `01. TRUSTED HELPERS`**
  * Shows 3 trusted people:
    1. Government / Tech Officer
    2. Village Center Entrepreneur (CSC VLE)
    3. Family Member
  * `APPROVE UNLOCK` button on each card: Click to simulate them giving digital approval.
  * Once 2 people approve, the `RESTORE MY ACCOUNT NOW →` green button unlocks.
* **Tab 2: `02. 12-WORD BACKUP PHRASE`**
  * Shows 12 emergency safety words (like in crypto wallets and bank vaults).
  * `PRINT BACKUP CARD` button: Prints a paper card to keep in a safe.
  * `[DEMO: AUTO-FILL SAVED 12 WORDS]` button: Auto-types the words for quick testing.
  * `UNLOCK WITH BACKUP WORDS` button: Checks words and unlocks account offline.

---

### Screen 4: `04. VILLAGE KIOSK & VOICE` (`InclusivityModule.svelte`)
* **Tab 1: `01. VILLAGE KIOSK QR CODE`**
  * Shows what a public village cyber cafe screen looks like.
  * `📱 SCAN QR CODE WITH OPERATOR / COMPANION PHONE` button:
    * Simulates a phone scanning the screen.
    * Shows `✓ LOGIN APPROVED! Zero passwords left on public PC`.
* **Tab 2: `02. SPOKEN VOICE CODE`**
  * Language buttons: `English (India)` or `हिन्दी (Hindi)`.
  * `🔊 PLAY SPOKEN CODE OUT LOUD (VOICE)` button:
    * Uses your computer speaker to speak the 3 verification numbers out loud in the chosen language.

---

### Screen 5: `05. MANAGE DEVICES` (`DeviceLedger.svelte`)
* **`+ ADD A NEW PHONE OR KEY` button:**
  * Opens a popup to register a new phone, USB key, or smart card.
* **Device Cards:**
  * Shows device name, connection type (USB, Bluetooth, NFC), and how many times it was used.
  * **`I LOST THIS DEVICE (BLOCK IT)` button:**
    * Instantly blocks that key so nobody can log in with it.
    * Can be unblocked anytime with the `UNBLOCK THIS DEVICE` button.
* **Recent Login History Table:**
  * Shows past logins, IP locations, and blocked scam attempts.

---

### Screen 6: `06. SECURITY REPORT` (`ThreatModelDossier.svelte`)
* Plain-English report for judges and reviewers:
  * 6 attacks that are 100% blocked (Fake websites, SIM swaps, stolen passwords, keyloggers, replay attacks, Wi-Fi snooping).
  * Extreme situations (stolen phone, computer virus) and how the system protects the user.
  * Government compliance (Indian DPDP Act 2023, Cert-In, Bank-Grade AAL3).

---

## 4. How to Change or Remove Anything

### Remove a Tab:
1. In `src/lib/components/TopNav.svelte`, delete the item from `navItems`.
2. In `src/App.svelte`, delete the matching `{:else if store.activeTab === '...'}` block.

### Change User Name or ID:
Open `src/lib/store.svelte.ts` and change:
```ts
user = $state({
  nationalId: 'YOUR-ID-HERE',
  name: 'Your Name Here',
  service: 'National Digital Identity Grid',
  ...
});
```ṭ
