-- Supabase Schema Migration: Breakfast Duel PWA
-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS household_profiles (
  id TEXT PRIMARY KEY, -- 'user_1', 'user_2'
  display_name TEXT NOT NULL,
  avatar_color TEXT DEFAULT 'emerald'
);

INSERT INTO household_profiles (id, display_name, avatar_color)
VALUES 
  ('user_1', 'Partner 1', 'emerald'),
  ('user_2', 'Partner 2', 'amber')
ON CONFLICT (id) DO NOTHING;

-- 2. Master Dishes Library
CREATE TABLE IF NOT EXISTS dishes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  regional_name TEXT,
  protein_grams NUMERIC NOT NULL,
  fiber_grams NUMERIC NOT NULL,
  calories_approx INTEGER NOT NULL,
  cook_time_mins INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  ingredients JSONB NOT NULL, -- Array of { "item": string, "quantity": string, "category": string }
  prep_heads_up TEXT,
  tags TEXT[] NOT NULL,
  last_cooked_at DATE
);

-- 3. Daily Decision Poll
CREATE TABLE IF NOT EXISTS daily_poll (
  target_date DATE PRIMARY KEY, -- Tomorrow's date (YYYY-MM-DD)
  candidate_ids TEXT[] NOT NULL,
  votes JSONB DEFAULT '{}'::jsonb, -- {"user_1": "dish_id", "user_2": "dish_id"}
  locked_dish_id TEXT REFERENCES dishes(id),
  locked_by TEXT,
  locked_at TIMESTAMPTZ,
  cooking_status TEXT DEFAULT 'pending', -- 'pending' | 'cooked' | 'swapped' | 'skipped'
  actual_dish_cooked TEXT REFERENCES dishes(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for anonymous access
ALTER TABLE household_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_poll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous all household_profiles" ON household_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous all dishes" ON dishes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous all daily_poll" ON daily_poll FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime Subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE daily_poll;
ALTER PUBLICATION supabase_realtime ADD TABLE household_profiles;
