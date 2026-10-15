<script lang="ts">
  import { store } from '../store.svelte';
  import type { TelemetryLog } from '../types';

  let selectedLog = $state<TelemetryLog | null>(null);
  let filterOpcode = $state<string>('ALL');

  let filteredLogs = $derived(
    filterOpcode === 'ALL'
      ? store.telemetry
      : store.telemetry.filter(l => l.opcode === filterOpcode)
  );

  function getFriendlyName(opcode: TelemetryLog['opcode']) {
    switch (opcode) {
      case 'INIT': return 'SYSTEM READY';
      case 'ENTROPY': return 'SECURITY CHALLENGE';
      case 'CLIENT_DATA': return 'WEBSITE CHECK';
      case 'AUTH_DATA': return 'FINGERPRINT CHECK';
      case 'SIG_VERIFY': return 'DIGITAL SIGNATURE';
      case 'OK': return 'VERIFIED';
      case 'ERR': return 'BLOCKED';
      default: return 'LOG';
    }
  }

  function getBadgeColor(opcode: TelemetryLog['opcode']) {
    switch (opcode) {
      case 'INIT': return 'bg-[#1e2330] text-[#8fa0c4] border-[#2b354c]';
      case 'ENTROPY': return 'bg-[#291e36] text-[#c99cf0] border-[#3e2c53]';
      case 'CLIENT_DATA': return 'bg-[#172b38] text-[#56bbf5] border-[#22445b]';
      case 'AUTH_DATA': return 'bg-[#312513] text-[#f7b752] border-[#4a391c]';
      case 'SIG_VERIFY': return 'bg-[#183125] text-[#4fe396] border-[#244c38]';
      case 'OK': return 'bg-[#003822] text-[#00ff99] border-[#00663e]';
      case 'ERR': return 'bg-[#3d1419] text-[#ff6174] border-[#5e1e27]';
      default: return 'bg-[#161820] text-[#939baa] border-[#252836]';
    }
  }

  function exportLogs() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(store.telemetry, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `security_audit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
</script>

<div class="h-full flex flex-col bg-[#08090c] hairline-border select-text">
  <!-- Terminal Header / Structural Bar -->
  <div class="px-3 py-2 bg-[#0c0e14] hairline-b flex items-center justify-between text-[11px] font-mono">
    <div class="flex items-center gap-2">
      <span class="w-1.5 h-1.5 bg-[#0052ff]"></span>
      <span class="font-bold text-[#f0f2f7] tracking-wider">LIVE SECURITY LOG</span>
      <span class="text-[#555d6e]">[{store.telemetry.length} EVENTS]</span>
    </div>

    <div class="flex items-center gap-2">
      <select 
        bind:value={filterOpcode} 
        class="bg-[#12151d] text-[10px] text-[#939baa] px-2 py-0.5 hairline-border focus:outline-none"
      >
        <option value="ALL">ALL STEPS</option>
        <option value="ENTROPY">SECURITY CHALLENGE</option>
        <option value="CLIENT_DATA">WEBSITE CHECK</option>
        <option value="AUTH_DATA">FINGERPRINT CHECK</option>
        <option value="SIG_VERIFY">DIGITAL SIGNATURE</option>
      </select>

      <button 
        onclick={exportLogs}
        class="px-2 py-0.5 bg-[#12151d] hover:bg-[#1b1f2b] text-[10px] text-[#939baa] hover:text-white hairline-border transition-colors cursor-pointer"
        title="Download complete security log as a JSON file"
      >
        DOWNLOAD LOG
      </button>

      <button 
        onclick={() => store.clearLogs()}
        class="px-2 py-0.5 bg-[#12151d] hover:bg-[#1b1f2b] text-[10px] text-[#939baa] hover:text-white hairline-border transition-colors cursor-pointer"
      >
        CLEAR
      </button>
    </div>
  </div>

  <!-- Real-Time Stream Area -->
  <div class="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-2.5 leading-relaxed bg-[#06070a] max-h-[580px]">
    {#if filteredLogs.length === 0}
      <div class="text-[#4e5566] text-center py-10">
        No events yet. Click "Log in with Fingerprint / Face ID" on the right.
      </div>
    {:else}
      {#each filteredLogs as log (log.id)}
        <div 
          class="p-2.5 bg-[#0b0d13] hairline-border hover:bg-[#10131c] transition-colors cursor-pointer group"
          onclick={() => selectedLog = log}
          role="button"
          tabindex="0"
          onkeydown={(e) => { if (e.key === 'Enter') selectedLog = log; }}
        >
          <!-- Log Entry Meta Row -->
          <div class="flex items-center justify-between text-[10px] text-[#697285] mb-1">
            <div class="flex items-center gap-2">
              <span class="text-[#4e5566]">{log.timestamp}</span>
              <span class="px-1.5 py-0.2 border text-[9px] font-bold tracking-wider {getBadgeColor(log.opcode)}">
                {getFriendlyName(log.opcode)}
              </span>
              <span class="text-[#abb3c4] font-medium tracking-tight">{log.stage}</span>
            </div>
            {#if log.rawPayload}
              <span class="text-[9px] text-[#4f5768] group-hover:text-[#56bbf5] transition-colors">
                [SEE DETAILS]
              </span>
            {/if}
          </div>

          <!-- Log Description -->
          <div class="text-[#d2d7e2] font-mono text-[11px] break-words">
            {log.details}
          </div>

          <!-- Structured Payload Snippet -->
          {#if log.rawPayload}
            <div class="mt-1.5 p-1.5 bg-[#07080c] hairline-border text-[10px] text-[#8f98aa] overflow-x-auto">
              <pre class="whitespace-pre-wrap">{typeof log.rawPayload === 'string' ? log.rawPayload : JSON.stringify(log.rawPayload, null, 2)}</pre>
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>

  <!-- Footer Status Bar -->
  <div class="px-3 py-1.5 bg-[#090a0e] hairline-t flex items-center justify-between text-[10px] font-mono text-[#6c7485]">
    <div class="flex items-center gap-2">
      <span class="inline-block w-1.5 h-1.5 bg-[#00d68f]"></span>
      <span>SECURITY MONITOR: ACTIVE</span>
    </div>
    <div class="text-[#8b93a5]">
      ENCRYPTED CONNECTION (TLS 1.3)
    </div>
  </div>
</div>

<!-- Modal Drawer for Deep Inspection if log clicked -->
{#if selectedLog}
  <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
    <div class="bg-[#0e1117] hairline-border max-w-2xl w-full p-4 font-mono text-[12px] shadow-2xl">
      <div class="flex items-center justify-between hairline-b pb-2 mb-3">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 border text-[10px] font-bold {getBadgeColor(selectedLog.opcode)}">
            {getFriendlyName(selectedLog.opcode)}
          </span>
          <span class="font-bold text-white">{selectedLog.stage}</span>
          <span class="text-[#6c7485] text-[10px]">{selectedLog.timestamp}</span>
        </div>
        <button 
          onclick={() => selectedLog = null}
          class="text-[#858d9e] hover:text-white px-2 py-0.5 hairline-border bg-[#161a23] cursor-pointer"
        >
          CLOSE [ESC]
        </button>
      </div>

      <div class="mb-3 text-[#d2d7e2]">
        {selectedLog.details}
      </div>

      {#if selectedLog.rawPayload}
        <div class="bg-[#060709] p-3 hairline-border text-[#7ce38b] max-h-80 overflow-y-auto text-[11px]">
          <pre>{typeof selectedLog.rawPayload === 'string' ? selectedLog.rawPayload : JSON.stringify(selectedLog.rawPayload, null, 2)}</pre>
        </div>
      {/if}
    </div>
  </div>
{/if}
