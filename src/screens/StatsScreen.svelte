<!--
  Stats: the library by cuisine, what you have cooked most and most
  recently — and, at the bottom, saving and restoring a backup.
-->
<script lang="ts">
  import DataCard from '../components/DataCard.svelte';
  import { formatDateShort } from '../lib/dates';
  import { CUISINE_TAGS } from '../lib/kitchen';
  import { data, isReady, recipeList } from '../lib/state.svelte';

  const SHOWN = 5;

  const counts = $derived(
    CUISINE_TAGS.map((tag) => ({
      tag,
      count: recipeList().filter((recipe) => recipe.tags.includes(tag)).length,
    })),
  );
  const maxCount = $derived(Math.max(1, ...counts.map((entry) => entry.count)));

  const cookedIds = $derived(Object.keys(data.stats).filter((id) => data.recipes[id]));
  const totalCooked = $derived(
    cookedIds.reduce((sum, id) => sum + (data.stats[id].cookCount || 0), 0),
  );
  const mostCooked = $derived(
    cookedIds
      .slice()
      .sort((a, b) => (data.stats[b].cookCount || 0) - (data.stats[a].cookCount || 0))
      .slice(0, SHOWN),
  );
  const recentlyCooked = $derived(
    cookedIds
      .filter((id) => data.stats[id].lastCookedAt)
      .sort(
        (a, b) =>
          new Date(data.stats[b].lastCookedAt).getTime() -
          new Date(data.stats[a].lastCookedAt).getTime(),
      )
      .slice(0, SHOWN),
  );
</script>

{#if !isReady()}
  <div class="load-note">Loading…</div>
{:else}
  <div class="card">
    <h3 style="font-size:16px;">Library</h3>
    <p style="color:var(--ink-soft);font-size:13.5px;margin:4px 0 14px;">
      {recipeList().length} recipes across {Object.keys(data.ingredients).length} base ingredients.
    </p>
    {#each counts as entry (entry.tag)}
      <div class="stat-bar-row">
        <span class="lbl">{entry.tag}</span>
        <div class="stat-bar-track">
          <div
            class="stat-bar-fill"
            style="width:{Math.round((entry.count / maxCount) * 100)}%;"
          ></div>
        </div>
        <span class="stat-bar-n">{entry.count}</span>
      </div>
    {/each}
  </div>

  <div class="card" style="margin-top:14px;">
    <h3 style="font-size:16px;">Captain’s log</h3>
    {#if !totalCooked}
      <p style="color:var(--ink-soft);font-size:13.5px;margin:4px 0 0;">
        Nothing logged yet — open a recipe and tap "I made this" after you cook it.
      </p>
    {:else}
      <p style="color:var(--ink-soft);font-size:13.5px;margin:4px 0 14px;">
        {totalCooked} dish{totalCooked > 1 ? 'es' : ''} cooked so far.
      </p>
      <div class="section-label" style="margin-top:0;">Most cooked</div>
      {#each mostCooked as id (id)}
        <div class="stat-bar-row">
          <span class="lbl" style="width:auto;flex:1;text-transform:none;"
            >{data.recipes[id].name}</span
          >
          <span class="stat-bar-n" style="width:auto;">{data.stats[id].cookCount}×</span>
        </div>
      {/each}
      {#if recentlyCooked.length}
        <div class="section-label">Recently cooked</div>
        {#each recentlyCooked as id (id)}
          <div class="stat-bar-row">
            <span class="lbl" style="width:auto;flex:1;text-transform:none;"
              >{data.recipes[id].name}</span
            >
            <span class="stat-bar-n" style="width:auto;"
              >{formatDateShort(data.stats[id].lastCookedAt.slice(0, 10))}</span
            >
          </div>
        {/each}
      {/if}
    {/if}
  </div>

  <DataCard />
{/if}
