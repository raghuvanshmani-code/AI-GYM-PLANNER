export interface UserData {
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number;
  height: number;
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  goal: 'lose_weight' | 'maintain_weight' | 'gain_muscle';
  allergies: string;
  preferences: string;
  medicalConditions: string;
  region: string;
  budget: 'low' | 'lower_middle' | 'middle' | 'upper_middle' | 'high';
  currency: string;
}

export interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface IngredientSubstitution {
  original: string;
  suggestions: string[];
}

export interface Recipe {
  prepTime: string;
  cookTime: string;
  servings: number;
  steps: string[];
}

export interface Meal {
  name: string;
  time: string;
  description: string;
  macros: MacroNutrients;
  recipe: Recipe;
  imageSearchTerm: string;
  ingredientSubstitutions: IngredientSubstitution[];
}

export interface DailyPlan {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  meals: Meal[];
  dailyTotals: MacroNutrients;
  estimatedCost: number;
}

export interface WeeklyAverages {
  macros: MacroNutrients;
  estimatedCost: number;
}

export interface DietPlan {
  disclaimer?: string;
  weeklyPlan: DailyPlan[];
  weeklyAverages: WeeklyAverages;
  currency: string;
}