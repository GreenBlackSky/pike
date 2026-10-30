<!--
  Home: two buttons that pick a recipe at random — one the pantry ("stores")
  can cover, or any at all ("Hit it", Captain Pike's catchphrase) — and the
  pick, with a way to open it or ask again.
-->
<script lang="ts">
  import { computeMacros, TIER_RSD } from '../lib/kitchen';
  import { data, isReady, openRecipe, pickRecipe, recipeList, ui } from '../lib/state.svelte';
  import type { PickMode } from '../lib/state.svelte';

  const pick = $derived(ui.randomPick);
  const recipe = $derived(pick ? data.recipes[pick.recipeId] : undefined);
  const macros = $derived(recipe ? computeMacros(recipe, data.ingredients) : null);
  const missingText = $derived(
    pick?.missing === 1 ? '1 ingredient short' : `${pick?.missing} ingredients short`,
  );

  const PICK_LABEL: Record<PickMode, string> = {
    cookable: 'From ship’s stores',
    any: 'From the whole galley',
  };
</script>

{#if !isReady()}
  <div class="load-note">Accessing galley database…</div>
{:else}
  <div class="pick-grid">
    <button
      class="card pick-card"
      data-action="pick-cookable"
      onclick={() => pickRecipe('cookable')}
    >
      <h3>Cook with what I have</h3>
      <p>A random recipe your stores already cover.</p>
    </button>
    <button class="card pick-card command" data-action="pick-any" onclick={() => pickRecipe('any')}>
      <h3>Hit it</h3>
      <p>Any of the {recipeList().length} recipes, at random.</p>
    </button>
  </div>

  {#if pick && recipe && macros}
    <div class="pick-result" id="randomResult">
      <div class="slot">{PICK_LABEL[pick.mode]}</div>
      <h2>{recipe.name}</h2>
      <div class="chips">
        <span class="chip">{recipe.timeMinutes} min</span>
        <span class="chip cost">~{TIER_RSD[recipe.costTier]} RSD/portion</span>
        <span class="chip">~{Math.round(macros.kcalPP)} kcal/portion</span>
        <span class="chip">{recipe.basePortions} portions</span>
      </div>
      {#if pick.missing}
        <p class="pick-warning">
          Insufficient stores, Captain: {missingText}. This is one of the closest. Mark what you
          have in Stores for better picks.
        </p>
      {/if}
      <div class="modal-actions">
        <button class="btn small" data-action="open-pick" onclick={() => openRecipe(recipe.id)}
          >Open recipe</button
        >
        <button
          class="btn small secondary"
          data-action="pick-again"
          onclick={() => pickRecipe(pick.mode)}>Another one</button
        >
      </div>
    </div>
  {/if}
{/if}
