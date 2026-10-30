<!--
  Pantry: every ingredient with its status — tap to cycle none → low →
  plenty. Fresh buys and staples are listed apart; "+ Add" adds an ingredient.
-->
<script lang="ts">
  import { pantryStatus } from '../lib/kitchen';
  import { cyclePantry, data, isReady, openAddIngredient, ui } from '../lib/state.svelte';

  const ids = $derived.by(() => {
    const query = ui.pantryQuery.trim().toLowerCase();
    return Object.keys(data.ingredients)
      .filter((id) => !query || data.ingredients[id].name.toLowerCase().includes(query))
      .sort((a, b) => data.ingredients[a].name.localeCompare(data.ingredients[b].name));
  });
  const fresh = $derived(ids.filter((id) => data.ingredients[id].freshBuy));
  const staples = $derived(ids.filter((id) => !data.ingredients[id].freshBuy));
</script>

{#snippet checklist(title: string, list: string[])}
  {#if list.length}
    <div class="section-label" style="margin-top:18px;">{title}</div>
    <div class="card">
      {#each list as id (id)}
        {@const status = pantryStatus(data.pantry, id)}
        <div class="pantry-row">
          <span class="pantry-dot {status}"></span>
          <span class="pantry-name">{data.ingredients[id].name}</span>
          <button
            class="pantry-status-btn {status !== 'none' ? status : ''}"
            data-action="cycle-pantry"
            data-id={id}
            onclick={() => cyclePantry(id)}>{status}</button
          >
        </div>
      {/each}
    </div>
  {/if}
{/snippet}

{#if !isReady()}
  <div class="load-note">Loading…</div>
{:else}
  <div style="display:flex;gap:8px;margin-bottom:12px;">
    <input
      type="search"
      id="pantrySearch"
      placeholder="Search ingredients…"
      bind:value={ui.pantryQuery}
      style="flex:1;"
    />
    <button
      class="btn secondary small"
      data-action="add-ingredient"
      style="flex-shrink:0;"
      onclick={openAddIngredient}>+ Add</button
    >
  </div>
  {@render checklist('Fresh buys', fresh)}
  {@render checklist('Staples', staples)}
  {#if !ids.length}<div class="no-results">No ingredients match.</div>{/if}

  <div class="section-label">Notes</div>
  <div class="tips-block">
    <p>
      Lidl and Dis usually beat Maxi/IDEA on staples like rice, pasta, oil, and canned beans — worth
      a separate stop if you're already out that way.
    </p>
    <p>
      Dried beans are cheaper than canned but need an overnight soak — worth batching a big pot and
      freezing portions if you're cooking bean dishes often.
    </p>
    <p>Tap any ingredient above to cycle its status in stores: none → low → plenty.</p>
  </div>
{/if}
