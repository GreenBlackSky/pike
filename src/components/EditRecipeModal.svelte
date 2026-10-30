<!--
  Editing a recipe: name, tags, time, cost, base portions, ingredient lines
  (ingredient, amount, how it is written, preparation), steps and a note.
  Nothing is saved until "Save changes".
-->
<script lang="ts">
  import { COST_TIERS, TAG_GROUPS } from '../lib/kitchen';
  import { closeModal, data, saveRecipeEdit, type RecipeDraft } from '../lib/state.svelte';
  import type { CostTier } from '../lib/types';

  const { draft }: { draft: RecipeDraft } = $props();

  /* the same look as the original's inline-styled fields */
  const FIELD_STYLE =
    'padding:7px;border-radius:6px;border:1px solid var(--card-line);background:var(--card);color:var(--ink);';
  const AREA_STYLE =
    'width:100%;padding:10px;border-radius:8px;border:1px solid var(--card-line);background:var(--card);color:var(--ink);font:inherit;';

  const ingredientOptions = $derived(
    Object.keys(data.ingredients).sort((a, b) =>
      data.ingredients[a].name.localeCompare(data.ingredients[b].name),
    ),
  );

  function toggleTag(tag: string): void {
    const index = draft.tags.indexOf(tag);
    if (index === -1) {
      draft.tags.push(tag);
    } else {
      draft.tags.splice(index, 1);
    }
  }

  function addLine(): void {
    draft.ingredients.push({
      ingredientId: ingredientOptions[0] ?? '',
      qty: 0,
      displayQty: '',
      prep: '',
    });
  }

  const value = (event: Event): string => (event.currentTarget as HTMLInputElement).value;
</script>

<h2>Edit recipe</h2>
<div class="section-label">Name</div>
<input type="text" id="editName" bind:value={draft.name} />

<div class="section-label">Tags</div>
<div class="filter-bar" style="margin-bottom:0;">
  {#each TAG_GROUPS as [label, tags] (label)}
    <div class="tag-group">
      <span class="gl">{label}</span>
      {#each tags as tag (tag)}
        <button
          type="button"
          class="pill"
          class:on={draft.tags.includes(tag)}
          data-action="edit-toggle-tag"
          data-tag={tag}
          onclick={() => toggleTag(tag)}>{tag}</button
        >
      {/each}
    </div>
  {/each}
</div>

<div class="section-label">Details</div>
<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:6px;">
  <label style="flex:1;min-width:110px;font-size:12.5px;color:var(--ink-soft);"
    >Time (min)<br /><input
      type="text"
      id="editTime"
      value={draft.timeMinutes}
      oninput={(event) => (draft.timeMinutes = parseInt(value(event), 10) || 0)}
    /></label
  >
  <label style="flex:1;min-width:110px;font-size:12.5px;color:var(--ink-soft);"
    >Cost tier<br /><select
      id="editCost"
      style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--card-line);background:var(--card);color:var(--ink);"
      bind:value={draft.costTier}
    >
      {#each COST_TIERS as tier (tier)}<option value={tier as CostTier}>{tier}</option>{/each}
    </select></label
  >
  <label style="flex:1;min-width:110px;font-size:12.5px;color:var(--ink-soft);"
    >Base portions<br /><input
      type="text"
      id="editPortions"
      value={draft.basePortions}
      oninput={(event) => (draft.basePortions = parseInt(value(event), 10) || 1)}
    /></label
  >
</div>

<div class="section-label">Ingredients</div>
<div id="editIngredients">
  {#each draft.ingredients as line, index (index)}
    <div
      class="ing-edit-line"
      style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--card-line);"
    >
      <select
        class="edit-ing-select"
        style="flex:2;min-width:150px;{FIELD_STYLE}"
        bind:value={line.ingredientId}
      >
        {#each ingredientOptions as id (id)}<option value={id}>{data.ingredients[id].name}</option
          >{/each}
      </select>
      <input
        type="text"
        class="edit-ing-qty"
        placeholder="qty"
        value={line.qty}
        oninput={(event) => (line.qty = parseFloat(value(event)) || 0)}
        style="width:70px;{FIELD_STYLE}"
      />
      <input
        type="text"
        class="edit-ing-disp"
        placeholder="display, e.g. 1 cup"
        bind:value={line.displayQty}
        style="width:130px;{FIELD_STYLE}"
      />
      <input
        type="text"
        class="edit-ing-prep"
        placeholder="prep, e.g. chopped"
        bind:value={line.prep}
        style="width:130px;{FIELD_STYLE}"
      />
      <button
        type="button"
        class="btn small secondary"
        data-action="edit-remove-ingredient"
        onclick={() => draft.ingredients.splice(index, 1)}>Remove</button
      >
    </div>
  {/each}
</div>
<button
  type="button"
  class="btn secondary small"
  data-action="edit-add-ingredient"
  onclick={addLine}>+ Add ingredient line</button
>

<div class="section-label">Steps (one per line)</div>
<textarea
  id="editSteps"
  rows="6"
  style={AREA_STYLE}
  value={draft.steps.join('\n')}
  oninput={(event) =>
    (draft.steps = value(event)
      .split('\n')
      .map((text) => text.trim())
      .filter(Boolean))}></textarea>
<div class="section-label">Note (optional)</div>
<textarea id="editNote" rows="2" style={AREA_STYLE} bind:value={draft.note}></textarea>

<div class="modal-actions">
  <button class="btn small" data-action="save-recipe-edit" onclick={() => saveRecipeEdit(draft)}
    >Save changes</button
  >
  <button class="btn small secondary" onclick={closeModal}>Cancel</button>
</div>
