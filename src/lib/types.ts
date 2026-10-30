/* What is saved in the database, collection by collection. Field names are
   part of the saved format (existing backups must keep importing), so they
   stay as they are. */

export type CostTier = 'lowest' | 'low' | 'low-med' | 'medium';
export type IngredientUnit = 'g' | 'ml' | 'piece';
export type PantryStatus = 'none' | 'low' | 'plenty';

/** 'ingredients/{id}'. Macros are per 100 g or 100 ml — or, for 'piece',
    per 100 pieces (so one piece is value / 100, and a line's qty counts pieces). */
export interface Ingredient {
  name: string;
  description?: string;
  unit: IngredientUnit;
  kcalPer100: number;
  fatPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  /** perishable, bought fresh — as opposed to a pantry staple */
  freshBuy: boolean;
}

/** One line of a recipe. qty is in the ingredient's unit (g, ml or pieces). */
export interface RecipeLine {
  ingredientId: string;
  qty: number;
  /** shown instead of the number when cooking the base amount, e.g. "1 tsp" */
  displayQty?: string;
  /** e.g. "chopped" */
  prep?: string;
}

/** 'recipes/{id}'; `id` is filled in from the document id when read. */
export interface Recipe {
  id: string;
  name: string;
  tags: string[];
  timeMinutes: number;
  costTier: CostTier;
  basePortions: number;
  ingredients: RecipeLine[];
  steps: string[];
  note?: string;
}

/** 'pantry/{ingredientId}' */
export interface PantryDoc {
  status: PantryStatus;
  updatedAt: string;
}

/** 'shoppingList/{random id}' */
export interface ShoppingItem {
  ingredientId: string;
  /** which recipe it was added for (older items: "this week's plan") */
  note?: string;
  addedAt?: string;
}

/* 'weekPlan/current' was the week plan, now removed. Older databases and
   backups may still hold it; the app no longer reads it, and a restore
   carries it along untouched. */

/** 'stats/{recipeId}' */
export interface CookStats {
  cookCount: number;
  lastCookedAt: string;
}
