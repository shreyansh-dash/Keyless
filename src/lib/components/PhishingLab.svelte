<script lang="ts">
  import { store } from '../store.svelte';

  function runAttack() {
    store.runPhishingSimulation();
  }
</script>

<div class="p-6 bg-[#08090c] min-h-[calc(100vh-84px)] space-y-6">
  <!-- Header Banner -->
  <div class="bg-[#0e1016] hairline-border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <div class="flex items-center gap-2 text-[11px] font-mono text-[#00ff99] mb-1">
        <span class="w-2 h-2 bg-[#00ff99]"></span>
        <span>REQUIREMENT 2: PHISHING RESISTANCE TEST</span>
      </div>
      <h1 class="text-2xl font-bold font-sans text-white tracking-tight uppercase">
        Fake Website (Phishing) Defense Test
      </h1>
      <p class="text-sm font-sans text-[#788194] max-w-3xl mt-1">
        Traditional passwords and SMS OTPs can easily be stolen by fake copycat websites. 
        Passkeys are <strong>cryptographically tied to the genuine website address</strong>, making it mathematically impossible for a scammer to capture or reuse your login.
      </p>
    </div>

    <div>
      <button
        onclick={runAttack}
        disabled={store.phishingSim.running}
        class="px-5 py-3 bg-[#ff3344] hover:bg-[#e02535] active:bg-[#c71e2c] text-white font-mono text-xs font-bold uppercase tracking-wider hairline-border flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
      >
        {#if store.phishingSim.running}
          <span class="w-3.5 h-3.5 border-2 border-white/30 border-t-white animate-spin"></span>
          <span>TESTING FAKE WEBSITE ATTACK...</span>
        {:else}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="square" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          <span>TEST A FAKE WEBSITE ATTACK</span>
        {/if}
      </button>
    </div>
  </div>

  <!-- Side-by-Side Origins Architecture Grid -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    
    <!-- LEFT: Real Official Website -->
    <div class="bg-[#0c0e14] hairline-border flex flex-col">
      <div class="p-3.5 bg-[#10131b] hairline-b flex items-center justify-between font-mono text-xs">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 bg-[#00d68f]"></span>
          <span class="font-bold text-white tracking-wide">REAL OFFICIAL GOVERNMENT WEBSITE</span>
        </div>
        <span class="px-2 py-0.5 bg-[#003822] text-[#00ff99] text-[10px] font-semibold hairline-border">
          GENUINE SITE
        </span>
      </div>

      <!-- Address Bar Simulator -->
      <div class="px-4 py-2 bg-[#08090d] hairline-b font-mono text-xs text-[#8f99ab] flex items-center gap-2">
        <span class="text-[#00d68f]">🔒 https://</span>
        <span class="text-white font-bold">id.digilocker.gov.in</span>
        <span class="text-[#555d6e]">/login</span>
      </div>

      <div class="p-5 flex-1 space-y-4 font-mono text-xs">
        <div class="p-3 bg-[#08090d] hairline-border space-y-2">
          <div class="text-[#5b6375] uppercase text-[10px] tracking-wider">Official Website Settings</div>
          <div class="grid grid-cols-2 gap-2 text-[11px]">
            <div><span class="text-[#474e5e]">Real Name: </span><span class="text-white">id.digilocker.gov.in</span></div>
            <div><span class="text-[#474e5e]">Full URL: </span><span class="text-white">https://id.digilocker.gov.in</span></div>
            <div><span class="text-[#474e5e]">Protection: </span><span class="text-[#00ff99]">Passkey Protected</span></div>
            <div><span class="text-[#474e5e]">Status: </span><span class="text-[#00ff99]">Secure & Verified</span></div>
          </div>
        </div>

        <div class="p-3 bg-[#08090d] hairline-border text-[11px] text-[#858e9f] space-y-1">
          <div class="text-white font-bold mb-1">How the Real Website Checks You:</div>
          <p>1. The server gives your browser a one-time random security challenge.</p>
          <p>2. Your browser automatically tags the exact website address you are visiting.</p>
          <p>3. Your fingerprint signs the challenge only for this exact domain.</p>
          <p class="text-[#00ff99]">4. If the domain doesn't match 100%, the login is rejected instantly.</p>
        </div>

        <!-- Verification Status Result -->
        {#if store.phishingSim.rpValidationResult === 'REJECT_ORIGIN_MISMATCH'}
          <div class="p-3.5 bg-[#3d1419] hairline-border border-[#5e1e27] text-[#ff6b7d] font-mono text-xs space-y-1 animate-fadeIn">
            <div class="font-bold uppercase tracking-wider flex items-center gap-2">
              <span>✕ ATTACK BLOCKED: FAKE WEBSITE REJECTED</span>
            </div>
            <div class="text-[11px] text-[#ff99a6]">
              A scammer tried to replay a login captured from <code class="bg-black/40 px-1 text-white">"id.digil0cker-gov.in"</code>. 
              The official site rejected it immediately because the website address didn't match. 
              <strong>Your account is 100% safe.</strong>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- RIGHT: Malicious Lookalike / Fake Website -->
    <div class="bg-[#0c0e14] hairline-border flex flex-col">
      <div class="p-3.5 bg-[#171216] hairline-b flex items-center justify-between font-mono text-xs">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 bg-[#ff3344]"></span>
          <span class="font-bold text-[#ff4d5e] tracking-wide">FAKE COPYCAT WEBSITE (SCAM SITE)</span>
        </div>
        <span class="px-2 py-0.5 bg-[#381014] text-[#ff6b7d] text-[10px] font-semibold hairline-border">
          DANGEROUS SCAM URL
        </span>
      </div>

      <!-- Address Bar Simulator -->
      <div class="px-4 py-2 bg-[#08090d] hairline-b font-mono text-xs text-[#8f99ab] flex items-center gap-2">
        <span class="text-[#ff3344]">⚠️ https://</span>
        <span class="text-[#ff4d5e] font-bold underline decoration-[#ff3344] decoration-2">id.digil0cker-gov.in</span>
        <span class="text-[#555d6e]">/login</span>
      </div>

      <div class="p-5 flex-1 space-y-4 font-mono text-xs">
        <div class="p-3 bg-[#08090d] hairline-border space-y-2">
          <div class="text-[#ff8080] uppercase text-[10px] tracking-wider font-semibold">How The Scam Works:</div>
          <p class="text-[#8f98aa] text-[11px]">
            Scammers send a fake SMS with a link that looks almost identical: <strong class="text-white">digil0cker</strong> (with a zero instead of the letter 'o').
          </p>
          <p class="text-[#ff99a6] text-[11px]">
            With passwords or OTPs, they steal your code and take over your account in seconds. 
            With passkeys, your phone and browser see the fake URL and block the scammer automatically!
          </p>
        </div>

        <!-- Captured ClientData Payload -->
        <div class="space-y-1.5">
          <div class="text-[#5b6375] uppercase text-[10px] tracking-wider">What the Browser Caught:</div>
          <div class="p-3 bg-[#06070a] hairline-border text-[11px] text-[#56bbf5] overflow-x-auto">
            {#if store.phishingSim.attackerPayload}
              <pre>{store.phishingSim.attackerPayload}</pre>
            {:else}
              <span class="text-[#4e5566]">Click "Test a Fake Website Attack" above to run the live test...</span>
            {/if}
          </div>
        </div>

        {#if store.phishingSim.rpValidationResult === 'REJECT_ORIGIN_MISMATCH'}
          <div class="p-3 bg-[#131720] hairline-border text-[11px] text-[#7ce38b] space-y-1">
            <span class="font-bold text-white">Why the Scammer Failed:</span>
            <p>
              The digital signature was stamped with the fake website name. 
              The scammer cannot change this name without breaking the digital signature. 
              <strong>Zero passwords stolen. Zero accounts hacked.</strong>
            </p>
          </div>
        {/if}
      </div>
    </div>

  </div>

  <!-- Attack Execution Step Logs -->
  {#if store.phishingSim.stepLogs.length > 0}
    <div class="bg-[#0b0d13] hairline-border p-4 font-mono text-xs space-y-2">
      <div class="text-[11px] font-bold text-white uppercase tracking-wider flex items-center justify-between hairline-b pb-2">
        <span>Step-by-Step Test Results</span>
        <span class="text-[#00ff99]">ATTACK 100% BLOCKED</span>
      </div>
      <div class="space-y-1 max-h-48 overflow-y-auto pt-1">
        {#each store.phishingSim.stepLogs as step}
          <div class="text-[#c1c7d6] flex items-start gap-2">
            <span class="text-[#0052ff] font-bold">›</span>
            <span>{step}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
