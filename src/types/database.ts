export type ProfileId = 'user_1' | 'user_2';

export interface Ingredient {
  item: string;
  quantity: string;
  category: 'Lentils & Grains' | 'Produce' | 'Spices' | 'Dairy & Nuts' | 'Oils' | 'Pantry' | string;
}

export interface Dish {
  id: string;
  name: string;
  regional_name?: string;
  protein_grams: number;
  fiber_grams: number;
  calories_approx: number;
  cook_time_mins: number;
  image_url: string;
  ingredients: Ingredient[];
  prep_heads_up?: string;
  tags: string[];
  last_cooked_at?: string | null;
}

export interface HouseholdProfile {
  id: ProfileId;
  display_name: string;
  avatar_color: string; // 'emerald' | 'amber' | 'rose' | 'indigo' | 'sky' | 'purple'
}

export type CookingStatus = 'pending' | 'cooked' | 'swapped' | 'skipped';

export type VoteMap = Record<string, string>; // { "user_1": "dish-id", "user_2": "dish-id" }

export interface DailyPoll {
  target_date: string; // YYYY-MM-DD (Tomorrow's date)
  candidate_ids: string[];
  votes: VoteMap;
  locked_dish_id: string | null;
  locked_by: string | null;
  locked_at: string | null;
  cooking_status: CookingStatus;
  actual_dish_cooked: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface HistoryAnalytics {
  totalLogged: number;
  adherenceRate: number; // percentage (0-100)
  cookedCount: number;
  swappedCount: number;
  skippedCount: number;
  topDishes: {
    dish: Dish;
    count: number;
  }[];
}
