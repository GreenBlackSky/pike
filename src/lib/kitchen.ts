import type {
  CostTier,
  Ingredient,
  PantryDoc,
  PantryStatus,
  Recipe,
  RecipeLine,
  ShoppingItem,
} from './types';

/* The kitchen's rules: macros, what the pantry is missing, and picking a
   recipe at random. Pure functions. */

/** Rough cost of one portion per cost tier, in Serbian dinars. */
export const TIER_RSD: Record<CostTier, number> = {
  lowest: 120,
  low: 180,
  'low-med': 240,
  medium: 300,
};
export const COST_TIERS: CostTier[] = ['lowest', 'low', 'low-med', 'medium'];

export const CUISINE_TAGS = [
  'italian',
  'mexican',
  'chinese',
  'japanese',
  'american',
  'mediterranean',
];

export const TAG_GROUPS: Array<[string, string[]]> = [
  ['Cuisine', CUISINE_TAGS],
  ['Meal type', ['breakfast', 'bakery', 'dessert']],
  ['Other', ['quick', 'no-cook', 'make-ahead']],
];

export interface Macros {
  kcal: number;
  fat: number;
  protein: number;
  carbs: number;
  /** some line names an ingredient that does not exist */
  missing: boolean;
  kcalPP: number;
  fatPP: number;
  proteinPP: number;
  carbsPP: number;
}

/** Totals for the whole recipe, and per portion (PP). */
export function computeMacros(recipe: Recipe, ingredients: Record<string, Ingredient>): Macros {
  let kcal = 0;
  let fat = 0;
  let protein = 0;
  let carbs = 0;
  let missing = false;
  for (const line of recipe.ingredients ?? []) {
    const ingredient = ingredients[line.ingredientId];
    if (!ingredient) {
      missing = true;
      continue;
    }
    const factor = line.qty / 100;
    kcal += ingredient.kcalPer100 * factor;
    fat += ingredient.fatPer100 * factor;
    protein += ingredient.proteinPer100 * factor;
    carbs += ingredient.carbsPer100 * factor;
  }
  const portions = recipe.basePortions || 1;
  return {
    kcal,
    fat,
    protein,
    carbs,
    missing,
    kcalPP: kcal / portions,
    fatPP: fat / portions,
    proteinPP: protein / portions,
    carbsPP: carbs / portions,
  };
}

export function pantryStatus(
  pantry: Record<string, PantryDoc>,
  ingredientId: string,
): PantryStatus {
  return pantry[ingredientId]?.status ?? 'none';
}

/** none → low → plenty → none */
export function nextPantryStatus(current: PantryStatus): PantryStatus {
  if (current === 'none') {
    return 'low';
  }
  return current === 'low' ? 'plenty' : 'none';
}

/** Lines whose ingredient is marked "none" in the pantry. */
export function missingCount(recipe: Recipe, pantry: Record<string, PantryDoc>): number {
  return (recipe.ingredients ?? []).filter(
    (line) => pantryStatus(pantry, line.ingredientId) === 'none',
  ).length;
}

/** Lines to buy: marked "none" or "low". */
export function missingOrLowLines(recipe: Recipe, pantry: Record<string, PantryDoc>): RecipeLine[] {
  return (recipe.ingredients ?? []).filter((line) => {
    const status = pantryStatus(pantry, line.ingredientId);
    return status === 'none' || status === 'low';
  });
}

/** What to put on the shopping list for these recipes: every ingredient
    that is out or low, once, unless it is on the list already. */
export function itemsToBuy(
  recipes: Array<Recipe | undefined>,
  pantry: Record<string, PantryDoc>,
  shopping: Record<string, ShoppingItem>,
  noteFor: (recipe: Recipe) => string,
): Array<{ ingredientId: string; note: string }> {
  const skip = new Set(Object.values(shopping).map((item) => item.ingredientId));
  const items: Array<{ ingredientId: string; note: string }> = [];
  for (const recipe of recipes) {
    if (!recipe) {
      continue;
    }
    for (const line of missingOrLowLines(recipe, pantry)) {
      if (!skip.has(line.ingredientId)) {
        skip.add(line.ingredientId);
        items.push({ ingredientId: line.ingredientId, note: noteFor(recipe) });
      }
    }
  }
  return items;
}

/** A random recipe, other than `avoidId` when there is any other — so
    asking again shows something new. Undefined from an empty list. */
export function pickRandomRecipe(recipes: Recipe[], avoidId?: string): Recipe | undefined {
  const others = recipes.filter((recipe) => recipe.id !== avoidId);
  const pool = others.length ? others : recipes;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** A random recipe that can be cooked from the pantry: nothing marked
    "none". When every recipe lacks something, one of those that lack the
    fewest — `missing` says how many lines are out. */
export function pickCookable(
  recipes: Recipe[],
  pantry: Record<string, PantryDoc>,
  avoidId?: string,
): { recipe: Recipe; missing: number } | undefined {
  if (!recipes.length) {
    return undefined;
  }
  const missingById = new Map(recipes.map((recipe) => [recipe.id, missingCount(recipe, pantry)]));
  const fewest = Math.min(...missingById.values());
  const best = recipes.filter((recipe) => missingById.get(recipe.id) === fewest);
  const recipe = pickRandomRecipe(best, avoidId);
  return recipe && { recipe, missing: fewest };
}

export interface RecipeFilters {
  query: string;
  tags: Record<string, boolean>;
  canMakeNow: boolean;
}

export function matchesFilters(
  recipe: Recipe,
  filters: RecipeFilters,
  ingredients: Record<string, Ingredient>,
  pantry: Record<string, PantryDoc>,
): boolean {
  const query = filters.query.trim().toLowerCase();
  if (query) {
    const nameMatch = recipe.name.toLowerCase().includes(query);
    const ingredientMatch = (recipe.ingredients ?? []).some((line) =>
      ingredients[line.ingredientId]?.name.toLowerCase().includes(query),
    );
    if (!nameMatch && !ingredientMatch) {
      return false;
    }
  }
  const activeTags = Object.keys(filters.tags).filter((tag) => filters.tags[tag]);
  if (activeTags.some((tag) => !recipe.tags.includes(tag))) {
    return false;
  }
  return !(filters.canMakeNow && missingCount(recipe, pantry) > 0);
}

/** A readable id from a name, made unique among existing ones:
    "Smoked paprika" → "smoked_paprika", then "smoked_paprika_2". */
export function uniqueSlug(name: string, taken: Record<string, unknown>, fallback: string): string {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || fallback;
  let id = base;
  let counter = 2;
  while (taken[id]) {
    id = `${base}_${counter}`;
    counter++;
  }
  return id;
}
