import starter from '../data/starter.json';
import { APP_ID, db } from './db';
import type { Backup } from './db';
import {
  itemsToBuy,
  nextPantryStatus,
  pantryStatus,
  pickCookable,
  pickRandomRecipe,
} from './kitchen';
import type {
  CookStats,
  Ingredient,
  IngredientUnit,
  PantryDoc,
  Recipe,
  RecipeLine,
  ShoppingItem,
} from './types';
import { nowISO } from './dates';
import { toast } from './ui/toast.svelte';

/* Everything the screens show, kept live from the database, and every action
   that changes it. Svelte re-draws whatever reads a $state value when it
   changes — like a spreadsheet recalculating. */

export type Tab = 'home' | 'recipes' | 'pantry' | 'shopping' | 'stats';

/** The editable copy of a recipe in the edit form. */
export interface RecipeDraft {
  id: string;
  name: string;
  tags: string[];
  timeMinutes: number;
  costTier: Recipe['costTier'];
  basePortions: number;
  ingredients: Array<Required<RecipeLine>>;
  steps: string[];
  note: string;
}

/** The new-ingredient form; numbers stay text until saved. */
export interface IngredientDraft {
  name: string;
  description: string;
  unit: IngredientUnit;
  kcalPer100: string;
  fatPer100: string;
  proteinPer100: string;
  carbsPer100: string;
  freshBuy: boolean;
}

export type Modal =
  | { kind: 'recipe'; id: string; portions: number }
  | { kind: 'edit'; draft: RecipeDraft }
  | { kind: 'add-ingredient'; draft: IngredientDraft }
  | null;

/** Home's two buttons: from what is in the pantry, or from everything. */
export type PickMode = 'cookable' | 'any';

/** What a Home button picked. `missing`: lines marked "none" in the pantry
    (above 0 only when nothing could be cooked from the pantry as it is). */
export interface RandomPick {
  mode: PickMode;
  recipeId: string;
  missing: number;
}

export const data = $state({
  ingredients: {} as Record<string, Ingredient>,
  recipes: {} as Record<string, Recipe>,
  pantry: {} as Record<string, PantryDoc>,
  shopping: {} as Record<string, ShoppingItem>,
  stats: {} as Record<string, CookStats>,
  loaded: { ingredients: false, recipes: false },
});

export const ui = $state({
  tab: 'home' as Tab,
  recipeQuery: '',
  recipeTags: {} as Record<string, boolean>,
  canMakeNow: false,
  pantryQuery: '',
  modal: null as Modal,
  /** the recipe a Home button picked */
  randomPick: null as RandomPick | null,
});

/** Recipes and ingredients have arrived (the rest can be empty). */
export const isReady = (): boolean => data.loaded.ingredients && data.loaded.recipes;

export const recipeList = (): Recipe[] => Object.values(data.recipes);

/* ---------------- loading ---------------- */

function toMap<T>(docs: Array<{ id: string; data(): T }>): Record<string, T> {
  return Object.fromEntries(docs.map((doc) => [doc.id, doc.data()]));
}

/** On a brand-new install, start with the 42 recipes and 96 ingredients. */
function seedIfEmpty(): void {
  if (!db.isEmpty()) {
    return;
  }
  db.importAll({
    format: 'local-db-backup',
    version: 1,
    app: APP_ID,
    exportedAt: nowISO(),
    collections: starter as Backup['collections'],
  });
}

export function startState(): void {
  seedIfEmpty();
  db.collection<Ingredient>('ingredients').onSnapshot((snap) => {
    data.ingredients = toMap(snap.docs);
    data.loaded.ingredients = true;
  });
  db.collection<Recipe>('recipes').onSnapshot((snap) => {
    data.recipes = Object.fromEntries(
      snap.docs.map((doc) => [doc.id, { ...doc.data(), id: doc.id }]),
    );
    data.loaded.recipes = true;
  });
  db.collection<PantryDoc>('pantry').onSnapshot((snap) => {
    data.pantry = toMap(snap.docs);
  });
  db.collection<ShoppingItem>('shoppingList').onSnapshot((snap) => {
    data.shopping = toMap(snap.docs);
  });
  db.collection<CookStats>('stats').onSnapshot((snap) => {
    data.stats = toMap(snap.docs);
  });
}

/* ---------------- modals ---------------- */

export function openRecipe(id: string): void {
  const recipe = data.recipes[id];
  ui.modal = { kind: 'recipe', id, portions: recipe ? recipe.basePortions : 1 };
}

export function openEditRecipe(id: string): void {
  const recipe = data.recipes[id];
  if (!recipe) {
    return;
  }
  ui.modal = {
    kind: 'edit',
    draft: {
      id,
      name: recipe.name,
      tags: (recipe.tags ?? []).slice(),
      timeMinutes: recipe.timeMinutes,
      costTier: recipe.costTier,
      basePortions: recipe.basePortions,
      ingredients: (recipe.ingredients ?? []).map((line) => ({
        ingredientId: line.ingredientId,
        qty: line.qty,
        displayQty: line.displayQty ?? '',
        prep: line.prep ?? '',
      })),
      steps: (recipe.steps ?? []).slice(),
      note: recipe.note ?? '',
    },
  };
}

export function openAddIngredient(): void {
  ui.modal = {
    kind: 'add-ingredient',
    draft: {
      name: '',
      description: '',
      unit: 'g',
      kcalPer100: '',
      fatPer100: '',
      proteinPer100: '',
      carbsPer100: '',
      freshBuy: false,
    },
  };
}

export function closeModal(): void {
  ui.modal = null;
}

/* ---------------- shopping and pantry ---------------- */

async function addToShopping(items: Array<{ ingredientId: string; note: string }>): Promise<void> {
  try {
    for (const item of items) {
      await db.collection<ShoppingItem>('shoppingList').add({ ...item, addedAt: nowISO() });
    }
    toast(`${items.length} item${items.length > 1 ? 's' : ''} added to shopping list`);
  } catch {
    toast('Couldn’t update the shopping list');
  }
}

export async function addMissingToShopping(recipeId: string): Promise<void> {
  const recipe = data.recipes[recipeId];
  if (!recipe) {
    return;
  }
  const items = itemsToBuy([recipe], data.pantry, data.shopping, () => recipe.name);
  if (!items.length) {
    toast('Already on your list, or nothing missing');
    return;
  }
  await addToShopping(items);
}

/** Bought it: off the list, and marked "plenty" in the pantry. */
export async function checkOffShopping(docId: string): Promise<void> {
  const item = data.shopping[docId];
  if (!item) {
    return;
  }
  try {
    await db.doc(`shoppingList/${docId}`).delete();
    await db
      .doc<PantryDoc>(`pantry/${item.ingredientId}`)
      .set({ status: 'plenty', updatedAt: nowISO() });
  } catch {
    toast('Couldn’t update');
  }
}

export async function removeShoppingItem(docId: string): Promise<void> {
  try {
    await db.doc(`shoppingList/${docId}`).delete();
  } catch {
    toast('Couldn’t remove item');
  }
}

export async function cyclePantry(ingredientId: string): Promise<void> {
  const next = nextPantryStatus(pantryStatus(data.pantry, ingredientId));
  try {
    await db.doc<PantryDoc>(`pantry/${ingredientId}`).set({ status: next, updatedAt: nowISO() });
  } catch {
    toast('Couldn’t update pantry');
  }
}

/* ---------------- recipes and ingredients ---------------- */

export async function saveRecipeEdit(draft: RecipeDraft): Promise<void> {
  if (!draft.name.trim()) {
    toast('Recipe needs a name');
    return;
  }
  const ingredients: RecipeLine[] = draft.ingredients
    .filter((line) => line.ingredientId)
    .map((line) => {
      const clean: RecipeLine = { ingredientId: line.ingredientId, qty: line.qty || 0 };
      if (line.displayQty) {
        clean.displayQty = line.displayQty;
      }
      if (line.prep) {
        clean.prep = line.prep;
      }
      return clean;
    });
  const recipe: Omit<Recipe, 'id'> = {
    name: draft.name.trim(),
    tags: draft.tags,
    timeMinutes: draft.timeMinutes || 0,
    costTier: draft.costTier,
    basePortions: draft.basePortions || 1,
    ingredients,
    steps: draft.steps,
    note: draft.note || '',
  };
  try {
    await db.doc<Omit<Recipe, 'id'>>(`recipes/${draft.id}`).set(recipe);
    toast('Recipe updated');
    closeModal();
  } catch {
    toast('Couldn’t save changes — try again');
  }
}

/** Pieces are entered per piece but saved per 100 pieces, like g and ml. */
const PIECE_MULTIPLIER = 100;

export async function saveNewIngredient(draft: IngredientDraft, id: string): Promise<void> {
  if (!draft.name.trim()) {
    toast('Ingredient needs a name');
    return;
  }
  const multiplier = draft.unit === 'piece' ? PIECE_MULTIPLIER : 1;
  const number = (text: string): number => (parseFloat(text) || 0) * multiplier;
  const ingredient: Ingredient = {
    name: draft.name.trim(),
    description: draft.description || '',
    unit: draft.unit,
    kcalPer100: number(draft.kcalPer100),
    fatPer100: number(draft.fatPer100),
    proteinPer100: number(draft.proteinPer100),
    carbsPer100: number(draft.carbsPer100),
    freshBuy: draft.freshBuy,
  };
  try {
    await db.doc<Ingredient>(`ingredients/${id}`).set(ingredient);
    toast(`Added "${ingredient.name}"`);
    closeModal();
  } catch {
    toast('Couldn’t save — try again');
  }
}

export async function markCooked(recipeId: string): Promise<void> {
  const count = (data.stats[recipeId]?.cookCount ?? 0) + 1;
  try {
    await db.doc<CookStats>(`stats/${recipeId}`).set({ cookCount: count, lastCookedAt: nowISO() });
    toast('Entered in the captain’s log.');
  } catch {
    toast('Couldn’t log that — try again');
  }
}

/** Home's two buttons. Asking again avoids the recipe just shown. */
export function pickRecipe(mode: PickMode): void {
  const shown = ui.randomPick?.recipeId;
  const pick =
    mode === 'cookable'
      ? pickCookable(recipeList(), data.pantry, shown)
      : { recipe: pickRandomRecipe(recipeList(), shown), missing: 0 };
  ui.randomPick = pick?.recipe ? { mode, recipeId: pick.recipe.id, missing: pick.missing } : null;
}
