<!--
  Pike: the tab bar at the top, one tab's screen at a time, and the
  sheet that slides up for a recipe (or the edit and add-ingredient
  forms). Which tab shows is just ui.tab.
-->
<script lang="ts">
  import AddIngredientModal from './components/AddIngredientModal.svelte';
  import EditRecipeModal from './components/EditRecipeModal.svelte';
  import RecipeModal from './components/RecipeModal.svelte';
  import { stardate } from './lib/dates';
  import { closeModal, ui, type Tab } from './lib/state.svelte';
  import { toastState } from './lib/ui/toast.svelte';
  import HomeScreen from './screens/HomeScreen.svelte';
  import PantryScreen from './screens/PantryScreen.svelte';
  import RecipesScreen from './screens/RecipesScreen.svelte';
  import ShoppingScreen from './screens/ShoppingScreen.svelte';
  import StatsScreen from './screens/StatsScreen.svelte';

  const TABS: Array<{ id: Tab; label: string }> = [
    { id: 'home', label: 'Home' },
    { id: 'recipes', label: 'Recipes' },
    { id: 'pantry', label: 'Stores' },
    { id: 'shopping', label: 'Shopping' },
    { id: 'stats', label: 'Log' },
  ];

  function openTab(tab: Tab): void {
    ui.tab = tab;
    window.scrollTo({ top: 0 });
  }
</script>

<div class="tabbar">
  <div class="tabbar-inner">
    {#each TABS as tab (tab.id)}
      <button
        class="tab-btn"
        class:active={ui.tab === tab.id}
        data-tab={tab.id}
        onclick={() => openTab(tab.id)}>{tab.label}</button
      >
    {/each}
  </div>
</div>
<header class="app-title">
  <h1>Pike</h1>
  <span class="stardate">Stardate {stardate()}</span>
</header>

<div class="wrap">
  <section class="screen active" id="screen-{ui.tab}">
    {#if ui.tab === 'recipes'}<RecipesScreen />
    {:else if ui.tab === 'pantry'}<PantryScreen />
    {:else if ui.tab === 'shopping'}<ShoppingScreen />
    {:else if ui.tab === 'stats'}<StatsScreen />
    {:else}<HomeScreen />
    {/if}
  </section>
</div>

{#if ui.modal}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div
    id="modalBackdrop"
    class="modal-backdrop"
    onclick={(event) => {
      if (event.target === event.currentTarget) {
        closeModal();
      }
    }}
  >
    <div id="modalSheet" class="modal-sheet">
      <button class="modal-close" data-action="close-modal" aria-label="Close" onclick={closeModal}
        >×</button
      >
      {#if ui.modal.kind === 'recipe'}
        <RecipeModal id={ui.modal.id} portions={ui.modal.portions} />
      {:else if ui.modal.kind === 'edit'}
        <EditRecipeModal draft={ui.modal.draft} />
      {:else if ui.modal.kind === 'add-ingredient'}
        <AddIngredientModal draft={ui.modal.draft} />
      {/if}
    </div>
  </div>
{/if}

<div id="toast" class="toast" class:show={toastState.visible} role="status">
  {toastState.message}
</div>
