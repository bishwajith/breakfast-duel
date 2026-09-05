import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load recipes.json
const recipesPath = path.resolve(__dirname, '../src/data/recipes.json');
const recipes = JSON.parse(fs.readFileSync(recipesPath, 'utf-8'));

// Read env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) are required.');
  console.error('Example: VITE_SUPABASE_URL=https://xyz.supabase.co VITE_SUPABASE_ANON_KEY=abc npm run seed');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedServer() {
  console.log('Seeding Supabase Server Database...');

  // 1. Seed Household Profiles
  console.log('1. Seeding household_profiles...');
  const { error: profileErr } = await supabase.from('household_profiles').upsert([
    { id: 'user_1', display_name: 'Partner 1', avatar_color: 'emerald' },
    { id: 'user_2', display_name: 'Partner 2', avatar_color: 'amber' }
  ], { onConflict: 'id' });
  if (profileErr) console.warn('Profiles upsert warning:', profileErr.message);
  else console.log('✓ household_profiles seeded successfully.');

  // 2. Seed Dishes
  console.log(`2. Seeding ${recipes.length} dishes from recipes.json...`);
  const { error: dishesErr } = await supabase.from('dishes').upsert(recipes, { onConflict: 'id' });
  if (dishesErr) console.error('Dishes upsert error:', dishesErr.message);
  else console.log(`✓ ${recipes.length} dishes seeded successfully.`);

  // 3. Create Tomorrow's Initial Poll
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const targetDate = tomorrow.toISOString().split('T')[0];

  console.log(`3. Initializing daily_poll for target date ${targetDate}...`);
  const candidates = recipes.slice(0, 3).map(d => d.id);
  const { error: pollErr } = await supabase.from('daily_poll').upsert({
    target_date: targetDate,
    candidate_ids: candidates,
    votes: {},
    locked_dish_id: null,
    locked_by: null,
    locked_at: null,
    cooking_status: 'pending'
  }, { onConflict: 'target_date' });

  if (pollErr) console.warn('Daily poll upsert warning:', pollErr.message);
  else console.log(`✓ daily_poll for ${targetDate} initialized.`);

  console.log('\nAll data is fully synchronized on the Supabase server!');
}

seedServer().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
