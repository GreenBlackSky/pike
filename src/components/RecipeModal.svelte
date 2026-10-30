<!--
  A recipe: time, cost, macros per portion, the ingredient list scaled to
  the chosen number of portions (each with its pantry dot), the steps — and
  buttons for the shopping list, editing and "I made this".
-->
<script lang="ts">
  import { formatDateShort } from '../lib/dates';
  import { computeMacros, pantryStatus } from '../lib/kitchen';
  import { formatQuantity, unitSuffix } from '../lib/quantity';
  import { addMissingToShopping, data, markCooked, openEditRecipe, ui } from '../lib/state.svelte';
  import type { RecipeLine } from '../lib/types';

  const { id, portions }: { id: string; portions: number } = $props();

  const MIN_PORTIONS = 1;
  const MAX_PORTIONS = 40;

  const recipe = $derived(data.recipes[id]);
  const factor = $derived(recipe ? portions / recipe.basePortions : 1);
  const macros = $derived(recipe ? computeMacros(recipe, data.ingredients) : null);
  const cooked = $derived(data.stats[id]);

  function step(by: number): void {
    if (ui.modal?.kind === 'recipe') {
      ui.modal.portions = Math.max(MIN_PORTIONS, Math.min(MAX_PORTIONS, portions + by));
    }
  }

  function quantityText(line: RecipeLine): string {
    const ingredient = data.ingredients[line.ingredientId];
    if (factor === 1 && line.displayQty) {
      return line.displayQty;
    }
    if (ingredient) {
      return formatQuantity(line.qty * factor) + unitSuffix(ingredient.unit);
    }
    return '?';
  }
</script>

{#if recipe && macros}
  <h2>{recipe.name}</h2>
  {#if cooked?.cookCount}
    <p style="color:var(--ink-soft);font-size:12.5px;margin-top:2px;">
      Cooked {cooked.cookCount} time{cooked.cookCount > 1 ? 's' : ''}{cooked.lastCookedAt
        ? `, last on ${formatDateShort(cooked.lastCookedAt.slice(0, 10))}`
        : ''}.
    </p>
  {/if}
  <div class="chips">
    <span class="chip">{recipe.timeMinutes} min</span>
    <span class="chip cost">{recipe.costTier}</span>
    <span class="chip">~{Math.round(macros.kcalPP)} kcal/portion</span>
    <span class="chip">~{Math.round(macros.fatPP)}g fat</span>
    <span class="chip">~{Math.round(macros.proteinPP)}g protein</span>
    <span class="chip">~{Math.round(macros.carbsPP)}g carbs</span>
  </div>
  <div class="chips">
    {#each recipe.tags as tag (tag)}<span class="chip tagpill">{tag}</span>{/each}
  </div>

  <div class="portion-stepper">
    <button class="pc-btn" data-action="portion-step" data-step="-1" onclick={() => step(-1)}
      >−</button
    >
    <span class="pc-count">{portions} portion{portions === 1 ? '' : 's'}</span>
    <button class="pc-btn" data-action="portion-step" data-step="1" onclick={() => step(1)}
      >+</button
    >
  </div>

  <div class="section-label">Ingredients</div>
  {#each recipe.ingredients ?? [] as line, index (index)}
    {@const ingredient = data.ingredients[line.ingredientId]}
    <div class="ing-line">
      <span class="pantry-dot {pantryStatus(data.pantry, line.ingredientId)}"></span>
      <span
        ><strong>{quantityText(line)}</strong>
        {ingredient ? ingredient.name : line.ingredientId}{line.prep ? ' ' : ''}{#if line.prep}<span
            class="prep">— {line.prep}</span
          >{/if}</span
      >
    </div>
  {/each}

  <div class="section-label">Steps</div>
  <ol class="steps">
    {#each recipe.steps ?? [] as text, index (index)}<li>{text}</li>{/each}
  </ol>

  {#if recipe.note}<div class="note">{recipe.note}</div>{/if}

  <div class="modal-actions">
    <button
      class="btn secondary small"
      data-action="add-missing"
      onclick={() => addMissingToShopping(id)}>Add missing to shopping list</button
    >
    <button class="btn secondary small" data-action="edit-recipe" onclick={() => openEditRecipe(id)}
      >Edit recipe</button
    >
    <button class="btn small" data-action="mark-cooked" onclick={() => markCooked(id)}
      >I made this</button
    >
  </div>
{/if}
