<!--
  Recipes: search by name or ingredient, filter by tag, or show only what
  can be made with what is in the pantry. Tap a card to open the recipe.
-->
<script lang="ts">
  import { computeMacros, matchesFilters, missingCount, TAG_GROUPS } from '../lib/kitchen';
  import { data, isReady, openRecipe, recipeList, ui } from '../lib/state.svelte';

  const presentTags = $derived(new Set(recipeList().flatMap((recipe) => recipe.tags)));
  const groups = $derived(
    TAG_GROUPS.map(([label, tags]) => ({
      label,
      tags: tags.filter((tag) => presentTags.has(tag)),
    })).filter((group) => group.tags.length),
  );
  const shown = $derived(
    recipeList()
      .filter((recipe) =>
        matchesFilters(
          recipe,
          { query: ui.recipeQuery, tags: ui.recipeTags, canMakeNow: ui.canMakeNow },
          data.ingredients,
          data.pantry,
        ),
      )
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  function toggleTag(tag: string): void {
    ui.recipeTags[tag] = !ui.recipeTags[tag];
  }
</script>

{#if !isReady()}
  <div class="load-note">Loading recipes…</div>
{:else}
  <div class="filter-bar">
    <input
      type="search"
      id="recipeSearch"
      placeholder="Search recipes or ingredients…"
      bind:value={ui.recipeQuery}
    />
    {#each groups as group (group.label)}
      <div class="tag-group">
        <span class="gl">{group.label}</span>
        {#each group.tags as tag (tag)}
          <button
            class="pill"
            class:on={ui.recipeTags[tag]}
            data-action="toggle-tag"
            data-tag={tag}
            onclick={() => toggleTag(tag)}>{tag}</button
          >
        {/each}
      </div>
    {/each}
    <label class="toggle-row"
      ><input type="checkbox" id="canMakeToggle" bind:checked={ui.canMakeNow} /> Can make now (nothing
      needed is marked "none" in Stores)</label
    >
  </div>

  {#if !shown.length}
    <div class="no-results">No recipes match. Try clearing a filter.</div>
  {:else}
    <div class="recipe-grid">
      {#each shown as recipe (recipe.id)}
        {@const macros = computeMacros(recipe, data.ingredients)}
        {@const missing = missingCount(recipe, data.pantry)}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div
          class="card recipe-card"
          data-action="open-recipe"
          data-id={recipe.id}
          onclick={() => openRecipe(recipe.id)}
        >
          <h3>{recipe.name}</h3>
          <div class="chips">
            <span class="chip">{recipe.timeMinutes} min</span>
            <span class="chip">~{Math.round(macros.kcalPP)} kcal</span>
            <span class="chip cost">{recipe.costTier}</span>
          </div>
          <div class="chips">
            {#each recipe.tags as tag (tag)}<span class="chip tagpill">{tag}</span>{/each}
          </div>
          {#if missing > 0}
            <div class="miss">
              {missing} ingredient{missing > 1 ? 's' : ''} out of stores
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
{/if}
