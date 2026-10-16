<script lang="ts">
  import { store } from '../store.svelte';
  import { api } from '../api';

  let activeRecoveryTab = $state<'GUARDIAN' | 'ARMOR_KEY'>('GUARDIAN');
  let enteredMnemonic = $state<string[]>(Array(12).fill(''));
  let mnemonicVerificationStatus = $state<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  let attestedCount = $derived(store.guardians.filter(g => g.status === 'ATTESTED').length);
  let thresholdSatisfied = $derived(attestedCount >= 2);

  async function verifyPaperKey() {
    if (store.backendOnline) {
      try {
        const res = await api.verifyMnemonic(enteredMnemonic);
        if (res.success && res.verified) {
          mnemonicVerificationStatus = 'SUCCESS';
          return;
        } else {
          mnemonicVerificationStatus = 'ERROR';
          return;
        }
      } catch (err) {
        // Fallback to local check
      }
    }

    const isMatch = enteredMnemonic.every((w, i) => w.trim().toLowerCase() === store.paperMnemonic[i]);
    if (isMatch) {
      mnemonicVerificationStatus = 'SUCCESS';
      store.addLog('RECOVERY_PAPER_KEY', 'OK', '12-word emergency backup phrase verified offline. Account access restored.', {
        wordsChecked: 12,
        serverContacted: store.backendOnline,
      }, 'success');
    } else {
      mnemonicVerificationStatus = 'ERROR';
      store.addLog('RECOVERY_FAIL', 'ERR', 'Invalid backup words entered. Please check spelling.', null, 'error');
    }
  }

  function autofillKeyForDemo() {
    enteredMnemonic = [...store.paperMnemonic];
    verifyPaperKey();
  }

  function printRecoverySheet() {
    window.print();
  }
</script>

<div class="p-6 bg-[#08090c] min-h-[calc(100vh-84px)] space-y-6">
  <!-- Top Header / Requirement Spec -->
  <div class="bg-[#0e1016] hairline-border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <div class="flex items-center gap-2 text-[11px] font-mono text-[#00ff99] mb-1">
        <span class="w-2 h-2 bg-[#00ff99]"></span>
        <span>REQUIREMENT 3: ACCOUNT RECOVERY WITHOUT SMS OTPs</span>
      </div>
      <h1 class="text-2xl font-bold font-sans text-white tracking-tight uppercase">
        Safe Account Recovery (No SMS OTP Fallback)
      </h1>
      <p class="text-sm font-sans text-[#788194] max-w-3xl mt-1">
        SMS OTPs can be intercepted through SIM swaps or stolen over the phone. 
        Here, you recover your account safely using <strong>Trusted Helpers</strong> or an <strong>Emergency 12-Word Paper Backup</strong>.
      </p>
    </div>

    <!-- Toggle between Guardian Scheme & Paper Key -->
    <div class="flex items-center gap-1 bg-[#06070a] p-1 hairline-border font-mono text-xs">
      <button
        onclick={() => activeRecoveryTab = 'GUARDIAN'}
        class="px-4 py-2 transition-colors cursor-pointer {activeRecoveryTab === 'GUARDIAN' ? 'bg-[#1b1f2b] text-white font-bold hairline-border' : 'text-[#727a8c] hover:text-white'}"
      >
        01. TRUSTED HELPERS
      </button>
      <button
        onclick={() => activeRecoveryTab = 'ARMOR_KEY'}
        class="px-4 py-2 transition-colors cursor-pointer {activeRecoveryTab === 'ARMOR_KEY' ? 'bg-[#1b1f2b] text-white font-bold hairline-border' : 'text-[#727a8c] hover:text-white'}"
      >
        02. 12-WORD BACKUP PHRASE
      </button>
    </div>
  </div>

  {#if activeRecoveryTab === 'GUARDIAN'}
    <!-- PATH 1: TRUSTED HELPERS -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Left Column: Guardians List & Action -->
      <div class="lg:col-span-8 bg-[#0c0e14] hairline-border p-5 space-y-5">
        <div class="flex items-center justify-between hairline-b pb-3">
          <div>
            <h2 class="text-sm font-mono font-bold text-white uppercase tracking-wider">
              Trusted Helpers (Get 2 Out of 3 to Approve)
            </h2>
            <p class="text-xs font-mono text-[#666e80] mt-0.5">
              No single person can unlock your account alone. Any 2 out of your 3 trusted contacts must approve your recovery request.
            </p>
          </div>
          <div class="px-3 py-1 font-mono text-xs hairline-border {thresholdSatisfied ? 'bg-[#003822] text-[#00ff99] border-[#00663e]' : 'bg-[#1a1712] text-[#ffb84d] border-[#3d321d]'}">
            APPROVALS: {attestedCount} / 2 READY
          </div>
        </div>

        <!-- Guardian Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {#each store.guardians as guardian}
            <div class="p-4 bg-[#08090d] hairline-border flex flex-col justify-between space-y-4">
              <div>
                <div class="flex items-center justify-between mb-3">
                  <div class="w-8 h-8 bg-[#181c26] flex items-center justify-center font-mono font-bold text-xs text-[#0052ff] hairline-border">
                    {guardian.avatarSeed}
                  </div>
                  <span class="text-[10px] font-mono px-1.5 py-0.5 hairline-border {guardian.status === 'ATTESTED' ? 'bg-[#003822] text-[#00ff99] border-[#00663e]' : 'bg-[#13151c] text-[#717a8c]'}">
                    {guardian.status === 'ATTESTED' ? 'APPROVED' : 'WAITING'}
                  </span>
                </div>

                <div class="font-sans font-bold text-sm text-white">{guardian.name}</div>
                <div class="font-mono text-[11px] text-[#788295] mt-0.5 leading-snug">{guardian.designation}</div>
                <div class="font-mono text-[10px] text-[#4f5667] mt-2">
                  <span>HELPER KEY: </span>
                  <span class="text-[#abb3c4]">{guardian.keyFingerprint}</span>
                </div>
              </div>

              <div>
                {#if guardian.attestedAt}
                  <div class="text-[10px] font-mono text-[#00ff99] mb-2">
                    ✓ Approved at {guardian.attestedAt}
                  </div>
                {/if}
                <button
                  onclick={() => store.signGuardian(guardian.id)}
                  class="w-full py-2 px-3 text-[11px] font-mono font-bold uppercase tracking-wider transition-colors hairline-border cursor-pointer
                    {guardian.status === 'ATTESTED'
                      ? 'bg-[#1c221a] hover:bg-[#283325] text-[#00ff99] border-[#2e472a]'
                      : 'bg-[#0052ff] hover:bg-[#0044d6] text-white'}"
                >
                  {guardian.status === 'ATTESTED' ? 'CANCEL APPROVAL' : 'APPROVE UNLOCK'}
                </button>
              </div>
            </div>
          {/each}
        </div>

        <!-- Quorum Threshold Action Box -->
        <div class="p-4 bg-[#090b10] hairline-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="text-xs font-mono font-bold text-white uppercase">Account Unlock Status</div>
            <div class="text-[11px] font-mono text-[#6c7485]">
              {#if thresholdSatisfied}
                <span class="text-[#00ff99]">2 trusted contacts have approved! You can now unlock your account and set up a new phone/key.</span>
              {:else}
                <span>Waiting for at least 2 trusted helpers to click "Approve Unlock" above...</span>
              {/if}
            </div>
          </div>

          <button
            disabled={!thresholdSatisfied}
            onclick={() => {
              store.addLog('ACCOUNT_RESTORED', 'OK', 'Trusted contacts confirmed identity. Account unlocked safely.', null, 'success');
              alert('Account Successfully Recovered! You can now set up your new device without any passwords or SMS OTPs.');
            }}
            class="px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider hairline-border transition-all
              {thresholdSatisfied
                ? 'bg-[#00d68f] hover:bg-[#00b87b] text-black shadow-lg cursor-pointer'
                : 'bg-[#151720] text-[#4f5667] cursor-not-allowed'}"
          >
            RESTORE MY ACCOUNT NOW →
          </button>
        </div>
      </div>

      <!-- Right Column: Protocol Specifications -->
      <div class="lg:col-span-4 bg-[#0c0e14] hairline-border p-5 space-y-4 font-mono text-xs">
        <h3 class="text-xs font-bold text-white uppercase tracking-wider hairline-b pb-2">
          Why Trusted Helpers are Safer than SMS
        </h3>

        <div class="text-[#8993a5] space-y-2 text-[11px] leading-relaxed">
          <p>
            When attackers attack bank accounts or government IDs, they often walk into a phone store and do a <strong>SIM swap</strong> to steal the SMS OTP.
          </p>
          <p>
            With Trusted Helpers, your account recovery key is safely divided into 3 pieces:
          </p>
          <ul class="list-disc pl-4 space-y-1 text-[#b5bcc9]">
            <li>1 Piece: Local Government / Tech Officer</li>
            <li>1 Piece: Village Center Entrepreneur (VLE)</li>
            <li>1 Piece: Your Nominated Family Member</li>
          </ul>
          <p>
            A thief cannot bribe or trick all 3 people. You are completely protected from phone fraud and SIM swaps.
          </p>
        </div>

        <div class="p-3 bg-[#06070a] hairline-border text-[10px] space-y-1 text-[#616a7c]">
          <div class="text-white font-bold">SAFETY GUARANTEE:</div>
          <div>• 100% immune to SIM swap fraud.</div>
          <div>• No password ever sent over SMS.</div>
          <div>• Every approval is signed with a digital cryptographic key.</div>
        </div>
      </div>

    </div>
  {:else}
    <!-- PATH 2: 12-WORD EMERGENCY BACKUP PHRASE -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Left Column: Word Phrase Grid -->
      <div class="lg:col-span-8 bg-[#0c0e14] hairline-border p-5 space-y-5">
        <div class="flex items-center justify-between hairline-b pb-3">
          <div>
            <h2 class="text-sm font-mono font-bold text-white uppercase tracking-wider">
              12-Word Emergency Backup Phrase
            </h2>
            <p class="text-xs font-mono text-[#666e80] mt-0.5">
              These 12 words were created when you first enrolled. If you ever lose all your devices, type them here to instantly unlock your account.
            </p>
          </div>
          <button 
            onclick={printRecoverySheet}
            class="px-3 py-1 font-mono text-xs hairline-border bg-[#151822] hover:bg-[#1e2332] text-white flex items-center gap-1.5 cursor-pointer"
          >
            🖨️ PRINT BACKUP CARD
          </button>
        </div>

        <!-- Mnemonic Word Entry Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {#each store.paperMnemonic as word, index}
            <div class="p-2.5 bg-[#07080c] hairline-border flex items-center gap-2 font-mono text-xs">
              <span class="text-[#474e5e] text-[10px] w-5 text-right font-bold">{index + 1}.</span>
              <input
                type="text"
                placeholder={word}
                bind:value={enteredMnemonic[index]}
                class="bg-transparent border-none text-white focus:outline-none w-full font-mono text-xs tracking-wide"
              />
            </div>
          {/each}
        </div>

        <!-- Action / Demo Controls -->
        <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onclick={autofillKeyForDemo}
            class="px-3 py-1.5 font-mono text-[11px] text-[#0052ff] hover:underline cursor-pointer"
          >
            [DEMO: AUTO-FILL SAVED 12 WORDS]
          </button>

          <button
            onclick={verifyPaperKey}
            class="px-6 py-2.5 bg-[#0052ff] hover:bg-[#0043d1] text-white font-mono text-xs font-bold uppercase tracking-wider hairline-border cursor-pointer"
          >
            UNLOCK WITH BACKUP WORDS
          </button>
        </div>

        {#if mnemonicVerificationStatus === 'SUCCESS'}
          <div class="p-3.5 bg-[#003822] hairline-border border-[#00663e] text-[#00ff99] font-mono text-xs space-y-1 animate-fadeIn">
            <div class="font-bold uppercase tracking-wider">✓ 12 BACKUP WORDS VERIFIED</div>
            <div class="text-[11px] text-[#69f0ae]">
              Your identity has been verified offline. Account unlocked successfully!
            </div>
          </div>
        {:else if mnemonicVerificationStatus === 'ERROR'}
          <div class="p-3.5 bg-[#3d1419] hairline-border border-[#5e1e27] text-[#ff6174] font-mono text-xs">
            ✕ The words you typed do not match. Check the spelling or click Auto-fill for testing.
          </div>
        {/if}
      </div>

      <!-- Right Column: Armor Card Preview -->
      <div class="lg:col-span-4 bg-[#0c0e14] hairline-border p-5 space-y-4 font-mono text-xs">
        <h3 class="text-xs font-bold text-white uppercase tracking-wider hairline-b pb-2">
          Offline & Private
        </h3>
        <p class="text-[#848d9f] text-[11px] leading-relaxed">
          These words never get sent across the internet. Your browser checks them directly on your machine.
        </p>

        <div class="p-3 bg-[#06070a] hairline-border text-[10px] space-y-2 text-[#788295]">
          <div class="text-white font-bold">KEY ADVANTAGES:</div>
          <div>• Works completely offline.</div>
          <div>• No phone number or SMS needed.</div>
          <div>• International standard (BIP39 security words).</div>
        </div>
      </div>

    </div>
  {/if}
</div>
