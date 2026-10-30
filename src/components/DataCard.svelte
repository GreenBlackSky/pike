<!--
  "Your data": everything is saved in this browser only (until Firebase is
  set up), so this is where a backup file is saved and restored. The backup
  exported from the original claude.ai app restores here too.
-->
<script lang="ts">
  import { APP_ID, db, type Backup } from '../lib/db';
  import { countDocs, downloadBackup, readBackupFile } from '../lib/db/backup';
  import { toast } from '../lib/ui/toast.svelte';

  let fileInput: HTMLInputElement;
  /** a backup read from a file, waiting for "Replace" */
  let pending = $state<Backup | null>(null);

  async function choose(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    try {
      pending = await readBackupFile(file, APP_ID);
    } catch (e) {
      toast((e as Error).message);
    }
  }

  function replace(): void {
    if (pending) {
      db.importAll(pending);
      pending = null;
      toast('Backup restored');
    }
  }
</script>

<div class="card" style="margin-top:14px;">
  <h3 style="font-size:16px;">Your data</h3>
  <p style="color:var(--ink-soft);font-size:13.5px;margin:4px 0 14px;">
    Saved in this browser only ({db.name.toLowerCase()}). Save a backup now and then — and before
    clearing browser data.
  </p>
  {#if pending}
    <p style="font-size:13.5px;margin:0 0 10px;" data-confirm>
      Replace everything on this device with the backup from
      {new Date(pending.exportedAt).toLocaleString()} ({countDocs(pending)} items)?
    </p>
    <div class="modal-actions" style="margin-top:0;">
      <button class="btn small" data-replace onclick={replace}>Replace</button>
      <button class="btn small secondary" onclick={() => (pending = null)}>Cancel</button>
    </div>
  {:else}
    <div class="modal-actions" style="margin-top:0;">
      <button class="btn secondary small" data-export onclick={() => downloadBackup(db, APP_ID)}
        >Save backup</button
      >
      <button class="btn secondary small" data-import onclick={() => fileInput.click()}
        >Restore backup…</button
      >
    </div>
  {/if}
  <input
    bind:this={fileInput}
    type="file"
    accept="application/json,.json"
    hidden
    onchange={choose}
  />
</div>
