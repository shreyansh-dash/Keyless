<script lang="ts">
  import { store } from '../store.svelte';

  let isScanning = $derived(store.biometricPrompt.status === 'SCANNING');
  let isVerified = $derived(store.biometricPrompt.status === 'SUCCESS_VERIFIED');
  let isRejected = $derived(store.biometricPrompt.status === 'MISMATCH_REJECTED');
  let isIdle = $derived(store.biometricPrompt.status === 'IDLE_WAITING');

  function handleTouchSensor() {
    if (store.biometricPrompt.mode === 'REGISTER') {
      store.confirmBiometricRegistration();
    } else {
      store.confirmBiometricVerification(true);
    }
  }

  function handleSimulateTheft() {
    store.confirmBiometricVerification(false);
  }

  function handleCancel() {
    store.cancelBiometricVerification();
  }
</script>

{#if store.biometricPrompt.open}
  <!-- MODAL BACKDROP -->
  <div class="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
    
    <!-- MODAL CARD: Swiss Precision, Matte Dark Architecture -->
    <div class="w-full max-w-md bg-[#0b0d13] hairline-border border-[#1e2330] p-6 sm:p-7 shadow-2xl relative font-mono text-xs flex flex-col gap-5">
      
      <!-- Top HUD Header -->
      <div class="flex items-center justify-between hairline-b pb-3 text-[10px]">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 {isVerified ? 'bg-[#00ff99]' : isRejected ? 'bg-[#ff3344] animate-pulse' : 'bg-[#0052ff] animate-ping'}"></span>
          <span class="font-bold text-white tracking-wider uppercase">
            {store.biometricPrompt.mode === 'REGISTER' ? 'FIDO2 ENROLLMENT PROMPT' : 'BIOMETRIC SENSOR VERIFICATION'}
          </span>
        </div>
        <span class="text-[9px] px-1.5 py-0.5 bg-[#141824] text-[#8e98aa] hairline-border uppercase">
          NIST SP 800-63B AAL3
        </span>
      </div>

      <!-- Citizen & Token Target Details Box -->
      <div class="p-3 bg-[#07080c] hairline-border space-y-2 text-[11px]">
        <div class="flex items-center justify-between">
          <span class="text-[#5c6475] uppercase text-[10px]">Target Citizen:</span>
          <span class="text-white font-bold">{store.biometricPrompt.citizenName}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-[#5c6475] uppercase text-[10px]">Aadhaar / National ID:</span>
          <span class="text-[#00ff99] font-mono">{store.biometricPrompt.nationalId}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-[#5c6475] uppercase text-[10px]">Hardware Token:</span>
          <span class="text-[#96a0b5]">{store.biometricPrompt.deviceModel}</span>
        </div>
        <div class="flex items-center justify-between hairline-t pt-1.5 text-[9px]">
          <span class="text-[#5c6475] uppercase">Server Nonce (256-bit):</span>
          <span class="text-[#788295] font-mono truncate max-w-[190px]">
            {store.biometricPrompt.challengeHex || '0x4f8a91c0e27b...'}
          </span>
        </div>
      </div>

      <!-- SENSOR TARGET INTERACTIVE AREA -->
      <div class="flex flex-col items-center justify-center py-4 bg-[#06070a] hairline-border relative overflow-hidden group">
        
        <!-- Background Radial Glow -->
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div class="w-40 h-40 rounded-full blur-2xl
            {isVerified ? 'bg-[#00ff99]' : isRejected ? 'bg-[#ff3344]' : isScanning ? 'bg-[#0052ff]' : 'bg-[#0052ff]'}">
          </div>
        </div>

        <!-- Touch Target Scanner -->
        <button
          type="button"
          onclick={handleTouchSensor}
          disabled={isScanning || isVerified}
          class="relative w-28 h-28 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-300 select-none
            {isVerified 
              ? 'border-[#00ff99] bg-[#003822]/40 shadow-[0_0_30px_rgba(0,255,153,0.3)]' 
              : isRejected 
                ? 'border-[#ff3344] bg-[#381014]/50 shadow-[0_0_30px_rgba(255,51,68,0.4)]' 
                : isScanning 
                  ? 'border-[#0052ff] bg-[#091535]/50 shadow-[0_0_25px_rgba(0,82,255,0.4)]' 
                  : 'border-[#2d3548] hover:border-[#00ff99] bg-[#0c101a] hover:shadow-[0_0_20px_rgba(0,255,153,0.2)]'}"
        >
          <!-- Animated Laser Scanning Line -->
          {#if isScanning}
            <div class="absolute inset-x-2 h-1 bg-[#00ff99] shadow-[0_0_12px_#00ff99] animate-laserSweep pointer-events-none z-10"></div>
          {/if}

          <!-- Fingerprint SVG Icon -->
          {#if isVerified}
            <!-- Success Checkmark -->
            <svg class="w-12 h-12 text-[#00ff99] animate-bounce" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="square" d="M5 13l4 4L19 7" />
            </svg>
          {:else if isRejected}
            <!-- Rejection Alert Icon -->
            <svg class="w-12 h-12 text-[#ff3344] animate-pulse" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="square" d="M6 18L18 6M6 6l12 12" />
            </svg>
          {:else}
            <!-- High-Precision Fingerprint / Sensor Icon -->
            <svg class="w-12 h-12 {isScanning ? 'text-[#00ff99]' : 'text-[#7f8a9e] group-hover:text-white'} transition-colors" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 004 11m0 0a8.003 8.003 0 0115.357-2m1.51 7.234a21.905 21.905 0 01-1.51 3.5m-3.44-2.04a13.916 13.916 0 00-2.753-9.571"/>
            </svg>
          {/if}
        </button>

        <!-- Status Message under scanner -->
        <div class="mt-4 text-center px-4">
          <div class="font-bold text-[12px] uppercase tracking-wider
            {isVerified ? 'text-[#00ff99]' : isRejected ? 'text-[#ff4d5a]' : isScanning ? 'text-[#56bbf5]' : 'text-white'}">
            {#if isVerified}
              ✓ BIOMETRIC MATCHED & ATTESTED
            {:else if isRejected}
              ✗ BIOMETRIC REJECTED / MISMATCH
            {:else if isScanning}
              EXTRACTING MINUTIAE & SIGNING CHALLENGE...
            {:else}
              TOUCH SENSOR TO SCAN FINGERPRINT
            {/if}
          </div>
          <p class="text-[10px] text-[#788295] mt-1 leading-normal">
            {store.biometricPrompt.statusMessage}
          </p>
        </div>

      </div>

      <!-- Action Buttons -->
      <div class="space-y-2">
        {#if isIdle}
          <button
            type="button"
            onclick={handleTouchSensor}
            class="w-full py-3 bg-[#0052ff] hover:bg-[#0044d6] active:bg-[#0038b3] text-white font-bold uppercase tracking-wider text-xs hairline-border cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <span>{store.biometricPrompt.mode === 'REGISTER' ? 'TOUCH SENSOR (AUTHORIZE PASSKEY)' : 'TOUCH SENSOR (VERIFY IDENTITY)'}</span>
          </button>

          {#if store.biometricPrompt.mode === 'LOGIN'}
            <!-- THEFT TEST BUTTON -->
            <button
              type="button"
              onclick={handleSimulateTheft}
              class="w-full py-2 bg-[#211215] hover:bg-[#31161c] text-[#ff7384] text-[11px] font-mono hairline-border border-[#4a1c24] cursor-pointer transition-colors flex items-center justify-center gap-2"
              title="Simulates an unauthorized imposter touching the sensor with an unregistered fingerprint"
            >
              <span>[TEST SECURITY] SIMULATE WRONG FINGER / THEFT ATTEMPT</span>
            </button>
          {/if}
        {/if}

        <button
          type="button"
          onclick={handleCancel}
          disabled={isScanning}
          class="w-full py-2 bg-[#12141c] hover:bg-[#1a1e2a] text-[#8e98aa] text-[11px] font-mono hairline-border cursor-pointer transition-colors disabled:opacity-50"
        >
          {isVerified || isRejected ? 'CLOSE WINDOW' : 'CANCEL VERIFICATION'}
        </button>
      </div>

      <!-- Privacy & Hardware Enclave Guarantee Footnote -->
      <div class="text-[9px] text-[#4d5566] hairline-t pt-2 flex items-center justify-between">
        <span>ENCLAVE ZERO-KNOWLEDGE: RAW BIOMETRICS NEVER LEAVE CHIP</span>
        <span class="text-[#00ff99]">INDIA DPDP 2023 COMPLIANT</span>
      </div>

    </div>
  </div>
{/if}

<style>
  @keyframes laserSweep {
    0% {
      top: 15%;
      opacity: 0.2;
    }
    50% {
      top: 80%;
      opacity: 1;
    }
    100% {
      top: 15%;
      opacity: 0.2;
    }
  }

  .animate-laserSweep {
    animation: laserSweep 1.2s infinite ease-in-out;
  }
</style>
