<script lang="ts">
  import { store } from '../store.svelte';
  import type { CredentialDevice } from '../types';

  let showEnrollModal = $state(false);
  let newDeviceModel = $state('YubiKey Security Key NFC');
  let newDeviceTransport = $state<'usb' | 'nfc' | 'internal' | 'hybrid'>('usb');

  function handleEnrollDevice() {
    const newId = `cred-${Date.now().toString(36)}`;
    const randomAaguid = `${Math.random().toString(16).substring(2, 10)}-${Math.random().toString(16).substring(2, 6)}-4a81-b6e1-${Math.random().toString(16).substring(2, 14)}`;
    const newCred: CredentialDevice = {
      id: newId,
      credentialIdBase64: 'vL91...e99X',
      publicKeyHex: '3059301306072a8648ce3d020106082a8648ce3d03010703420004...' + Math.random().toString(16).substring(2, 18),
      deviceModel: newDeviceModel,
      aaguid: randomAaguid,
      algorithm: 'ES256 (P-256 ECDSA)',
      counter: 0,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      lastUsedAt: 'Never (Newly Enrolled)',
      transports: [newDeviceTransport],
      userVerified: true,
      userPresent: true,
      revoked: false,
      trustLevel: newDeviceTransport === 'internal' ? 'ENCLAVE_TIER_1' : 'ROAMING_FIDO2',
    };

    store.devices = [newCred, ...store.devices];
    store.addLog('KEY_REGISTRATION', 'OK', `New device added successfully: [${newDeviceModel}]`, {
      deviceName: newDeviceModel,
      connection: newDeviceTransport,
    }, 'success');

    showEnrollModal = false;
  }
</script>

<div class="p-6 bg-[#08090c] min-h-[calc(100vh-84px)] space-y-6">
  <!-- Header / Admin View Banner -->
  <div class="bg-[#0e1016] hairline-border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <div class="flex items-center gap-2 text-[11px] font-mono text-[#00ff99] mb-1">
        <span class="w-2 h-2 bg-[#00ff99]"></span>
        <span>REQUIREMENTS 4 & 7: MANAGE CONNECTED DEVICES</span>
      </div>
      <h1 class="text-2xl font-bold font-sans text-white tracking-tight uppercase">
        Manage Your Phones & Security Keys
      </h1>
      <p class="text-sm font-sans text-[#788194] max-w-3xl mt-1">
        See every phone, laptop, and security key attached to your account. You can register a backup device or <strong>instantly block a lost or stolen device</strong> with one click.
      </p>
    </div>

    <div>
      <button
        onclick={() => showEnrollModal = true}
        class="px-5 py-3 bg-[#0052ff] hover:bg-[#0042d1] active:bg-[#0038b3] text-white font-mono text-xs font-bold uppercase tracking-wider hairline-border flex items-center gap-2 cursor-pointer shadow-lg"
      >
        <span>+ ADD A NEW PHONE OR KEY</span>
      </button>
    </div>
  </div>

  <!-- Device Inventory Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
    {#each store.devices as device (device.id)}
      <div class="bg-[#0c0e14] hairline-border p-5 flex flex-col justify-between space-y-5 {device.revoked ? 'opacity-60 bg-[#120f12]' : ''}">
        
        <div>
          <!-- Card Header & Status -->
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-3 h-3 rounded-none {device.revoked ? 'bg-[#ff3344]' : 'bg-[#00d68f]'}"></div>
              <span class="font-mono text-xs font-bold text-white tracking-tight">
                {device.deviceModel}
              </span>
            </div>
            <span class="text-[9px] font-mono px-2 py-0.5 hairline-border uppercase font-bold
              {device.revoked 
                ? 'bg-[#381014] text-[#ff6b7d] border-[#5e1e27]' 
                : 'bg-[#003822] text-[#00ff99] border-[#00663e]'}">
              {device.revoked ? 'BLOCKED' : 'ACTIVE'}
            </span>
          </div>

          <!-- Trust Level & Key Alg -->
          <div class="font-mono text-[10px] text-[#5c6475] mb-4">
            <span>TYPE: </span>
            <span class="text-[#8e98aa]">{device.trustLevel.replace('_', ' ')}</span>
            <span class="mx-1.5 text-[#3b4252]">•</span>
            <span>PROTECTION: </span>
            <span class="text-[#00ff99]">Hardware Protected</span>
          </div>

          <!-- Metadata Properties Table -->
          <div class="space-y-2 font-mono text-[11px] bg-[#07080c] p-3 hairline-border">
            <div class="flex justify-between">
              <span class="text-[#4e5566]">DEVICE ID:</span>
              <span class="text-[#abb3c4]">{device.aaguid.substring(0, 16)}...</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#4e5566]">CONNECTION:</span>
              <span class="text-[#abb3c4] uppercase">{device.transports.join(', ')}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#4e5566]">TIMES USED:</span>
              <span class="text-[#00ff99] font-bold">{device.counter}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#4e5566]">LAST LOGIN:</span>
              <span class="text-[#8e98aa]">{device.lastUsedAt}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="pt-2 hairline-t flex items-center justify-between">
          <span class="font-mono text-[10px] text-[#555d6e]">SLOT: {device.id}</span>
          <button
            onclick={() => store.toggleRevokeDevice(device.id)}
            class="px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider hairline-border cursor-pointer transition-colors
              {device.revoked
                ? 'bg-[#151822] hover:bg-[#1f2433] text-white border-[#2b3040]'
                : 'bg-[#2b1216] hover:bg-[#401920] text-[#ff6174] border-[#5e1e27]'}"
          >
            {device.revoked ? 'UNBLOCK THIS DEVICE' : 'I LOST THIS DEVICE (BLOCK IT)'}
          </button>
        </div>

      </div>
    {/each}
  </div>

  <!-- Login History Audit Table (Admin View) -->
  <div class="bg-[#0c0e14] hairline-border p-5 space-y-4">
    <div class="flex items-center justify-between hairline-b pb-3">
      <div>
        <h2 class="text-sm font-mono font-bold text-white uppercase tracking-wider">
          Recent Login History
        </h2>
        <p class="text-xs font-mono text-[#666e80] mt-0.5">
          See every recent login, which device was used, and if any suspicious logins were blocked.
        </p>
      </div>
      <div class="text-[10px] font-mono text-[#00ff99]">
        AUDIT LOG: VERIFIED
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-left font-mono text-xs">
        <thead class="bg-[#08090d] text-[#697285] hairline-b text-[10px] uppercase">
          <tr>
            <th class="p-2.5">DATE & TIME</th>
            <th class="p-2.5">DEVICE USED</th>
            <th class="p-2.5">WEBSITE</th>
            <th class="p-2.5">CITY / IP</th>
            <th class="p-2.5">SECURITY CHECK</th>
            <th class="p-2.5">RISK</th>
            <th class="p-2.5">RESULT</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#171a24] text-[11px]">
          <tr class="hover:bg-[#10131c]">
            <td class="p-2.5 text-[#8e98aa]">Just now</td>
            <td class="p-2.5 text-white font-medium">Apple Touch ID</td>
            <td class="p-2.5 text-[#56bbf5]">https://id.digilocker.gov.in</td>
            <td class="p-2.5 text-[#8e98aa]">New Delhi (103.24.112.44)</td>
            <td class="p-2.5 text-[#00ff99]">Fingerprint Confirmed</td>
            <td class="p-2.5 text-[#00ff99]">Normal</td>
            <td class="p-2.5"><span class="px-1.5 py-0.5 bg-[#003822] text-[#00ff99] text-[9px] font-bold">ALLOWED</span></td>
          </tr>
          <tr class="hover:bg-[#10131c]">
            <td class="p-2.5 text-[#8e98aa]">Yesterday 14:20</td>
            <td class="p-2.5 text-white font-medium">YubiKey 5C NFC</td>
            <td class="p-2.5 text-[#56bbf5]">https://id.digilocker.gov.in</td>
            <td class="p-2.5 text-[#8e98aa]">IIT Delhi (14.139.220.10)</td>
            <td class="p-2.5 text-[#00ff99]">Hardware Key Tap</td>
            <td class="p-2.5 text-[#00ff99]">Normal</td>
            <td class="p-2.5"><span class="px-1.5 py-0.5 bg-[#003822] text-[#00ff99] text-[9px] font-bold">ALLOWED</span></td>
          </tr>
          <tr class="hover:bg-[#10131c]">
            <td class="p-2.5 text-[#8e98aa]">3 days ago</td>
            <td class="p-2.5 text-white font-medium">Google Titan M2</td>
            <td class="p-2.5 text-[#ff6174]">https://id.digil0cker-gov.in</td>
            <td class="p-2.5 text-[#8e98aa]">Foreign IP (185.220.101.5)</td>
            <td class="p-2.5 text-[#ff6174]">Blocked Fake Website</td>
            <td class="p-2.5 text-[#ff6174]">DANGEROUS</td>
            <td class="p-2.5"><span class="px-1.5 py-0.5 bg-[#3d1419] text-[#ff6174] text-[9px] font-bold">BLOCKED</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Modal for Enrolling New Device -->
{#if showEnrollModal}
  <div class="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
    <div class="bg-[#0e1117] hairline-border max-w-md w-full p-6 font-mono text-xs shadow-2xl space-y-5">
      <div class="flex items-center justify-between hairline-b pb-3">
        <h3 class="font-bold text-white uppercase text-sm">Add a New Device or Key</h3>
        <button onclick={() => showEnrollModal = false} class="text-[#727a8c] hover:text-white cursor-pointer">[ESC]</button>
      </div>

      <div class="space-y-4">
        <div>
          <label for="device-model-input" class="block text-[10px] text-[#555d6e] uppercase mb-1">Name of Phone or Key</label>
          <input
            id="device-model-input"
            type="text"
            bind:value={newDeviceModel}
            class="w-full p-2 bg-[#06070a] hairline-border text-white focus:outline-none"
          />
        </div>

        <div>
          <label for="transport-select" class="block text-[10px] text-[#555d6e] uppercase mb-1">How It Connects</label>
          <select
            id="transport-select"
            bind:value={newDeviceTransport}
            class="w-full p-2 bg-[#06070a] hairline-border text-white focus:outline-none"
          >
            <option value="usb">USB (Plug-in Security Key)</option>
            <option value="nfc">NFC (Tap card against phone)</option>
            <option value="internal">Phone Fingerprint / Face ID</option>
            <option value="hybrid">QR Code / Bluetooth Scan</option>
          </select>
        </div>

        <div class="p-3 bg-[#06070a] hairline-border text-[11px] text-[#8e98aa]">
          Your device will create a new unique security code. It will never share your fingerprint or personal data with the website.
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 hairline-t">
        <button
          onclick={() => showEnrollModal = false}
          class="px-4 py-2 bg-[#151922] hover:bg-[#1e2332] text-white cursor-pointer"
        >
          CANCEL
        </button>
        <button
          onclick={handleEnrollDevice}
          class="px-5 py-2 bg-[#0052ff] hover:bg-[#0042cc] text-white font-bold cursor-pointer"
        >
          SAVE & REGISTER DEVICE
        </button>
      </div>
    </div>
  </div>
{/if}
