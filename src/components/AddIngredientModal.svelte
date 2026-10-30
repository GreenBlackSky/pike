<!--
  Adding an ingredient: name, description, unit (g, ml or piece), macros
  per 100 g / 100 ml / one piece, and whether it is a fresh buy.
-->
<script lang="ts">
  import { uniqueSlug } from '../lib/kitchen';
  import { closeModal, data, saveNewIngredient, type IngredientDraft } from '../lib/state.svelte';

  const { draft }: { draft: IngredientDraft } = $props();

  const MACRO_FIELDS: Array<[keyof IngredientDraft & `${string}Per100`, string]> = [
    ['kcalPer100', 'Kcal'],
    ['fatPer100', 'Fat (g)'],
    ['proteinPer100', 'Protein (g)'],
    ['carbsPer100', 'Carbs (g)'],
  ];

  const isPiece = $derived(draft.unit === 'piece');
  const macroLabel = $derived.by(() => {
    if (isPiece) {
      return 'per piece';
    }
    return draft.unit === 'ml' ? 'per 100ml' : 'per 100g';
  });

  function save(): void {
    void saveNewIngredient(draft, uniqueSlug(draft.name, data.ingredients, 'ingredient'));
  }
</script>

<h2>Add ingredient</h2>
<div class="section-label">Name</div>
<input type="text" id="newIngName" bind:value={draft.name} placeholder="e.g. Smoked paprika" />
<div class="section-label">Description (optional)</div>
<input type="text" id="newIngDesc" bind:value={draft.description} placeholder="e.g. Dry spice" />
<div class="section-label">Unit</div>
<select
  id="newIngUnit"
  style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--card-line);background:var(--card);color:var(--ink);"
  bind:value={draft.unit}
>
  <option value="g">g</option>
  <option value="ml">ml</option>
  <option value="piece">piece</option>
</select>
<div class="section-label">Macros ({macroLabel})</div>
<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:6px;">
  {#each MACRO_FIELDS as [field, label] (field)}
    <label style="flex:1;min-width:100px;font-size:12.5px;color:var(--ink-soft);"
      >{label}<br /><input type="text" id="newIng_{field}" bind:value={draft[field]} /></label
    >
  {/each}
</div>
{#if isPiece}
  <p style="color:var(--ink-faint);font-size:12px;margin-top:-2px;">
    Enter the values for one piece — e.g. one apple is about 95 kcal, so put 95.
  </p>
{/if}
<label class="toggle-row"
  ><input type="checkbox" id="newIngFresh" bind:checked={draft.freshBuy} /> Fresh buy (perishable, not
  a pantry staple)</label
>
<div class="modal-actions">
  <button class="btn small" data-action="save-new-ingredient" onclick={save}>Add ingredient</button>
  <button class="btn small secondary" onclick={closeModal}>Cancel</button>
</div>
