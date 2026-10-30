<!--
  Shopping: the list, A–Z. The square ticks an item off (and marks it
  "plenty" in the pantry); × just removes it.
-->
<script lang="ts">
  import { checkOffShopping, data, isReady, removeShoppingItem } from '../lib/state.svelte';

  const nameOf = (docId: string): string => {
    const item = data.shopping[docId];
    return data.ingredients[item.ingredientId]?.name ?? item.ingredientId;
  };
  const docIds = $derived(
    Object.keys(data.shopping).sort((a, b) => {
      const nameA = data.ingredients[data.shopping[a].ingredientId]?.name ?? '';
      const nameB = data.ingredients[data.shopping[b].ingredientId]?.name ?? '';
      return nameA.localeCompare(nameB);
    }),
  );
</script>

{#if !isReady()}
  <div class="load-note">Loading…</div>
{:else if !docIds.length}
  <div class="empty-note">
    Nothing on your list right now. Add items from a recipe's "Add missing to shopping list". Pike
    cooks the real thing — no replicators.
  </div>
{:else}
  <div class="card">
    {#each docIds as docId (docId)}
      {@const item = data.shopping[docId]}
      <div class="shop-item">
        <button
          class="shop-check"
          data-action="check-shopping"
          data-docid={docId}
          title="Got it — mark as in stock"
          aria-label="Got {nameOf(docId)}"
          onclick={() => checkOffShopping(docId)}
        ></button>
        <span class="shop-name"
          >{nameOf(docId)}{item.note ? ' ' : ''}{#if item.note}<span class="shop-note"
              >— {item.note}</span
            >{/if}</span
        >
        <button
          class="shop-remove"
          data-action="remove-shopping"
          data-docid={docId}
          title="Remove from list"
          onclick={() => removeShoppingItem(docId)}>×</button
        >
      </div>
    {/each}
  </div>
{/if}
