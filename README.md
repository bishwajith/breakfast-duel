# 🥘 Breakfast Duel PWA

A mobile-first Progressive Web App (PWA) built with **Vite, React (TypeScript), Tailwind CSS, Lucide Icons, and Supabase Realtime** for household partners in South India deciding tomorrow's breakfast every evening.

Focused strictly on **high-protein, high-fiber, and low-glycemic South Indian breakfast items**.

---

## ✨ Features

1. **User Onboarding & Profile Customization:**
   - Welcome modal to customize names and avatar color themes for both household members (e.g. Priya & Karthik).
   - 1-tap header profile switcher to easily toggle between users on a shared phone or individual phones.

2. **Nightly Selection Duel (Voting & Direct Lock):**
   - Suggests 3 fresh candidates for tomorrow morning, automatically excluding dishes cooked within the last 3 days.
   - Each card features:
     - High-res food image with gradient overlay.
     - Title + regional name badge.
     - Protein (g), Fiber (g), Est. Cook Time, and Approx Calories.
     - Prep alert heads-up banner (e.g. *"Soak whole green moong 4-6 hours or overnight"*).
     - Expandable categorized ingredients drawer with exact quantities.
     - Live vote badges showing each partner's vote in real time.
   - **Voting Logic:**
     - Tapping "Vote" toggles your vote.
     - When both partners vote for the same dish, **celebratory confetti fires** and the dish **auto-locks**!
     - **Direct Lock:** One-tap override to immediately confirm a dish without waiting.
   - **Shuffle / Reroll:** Randomly picks 3 fresh eligible dishes.

3. **Locked Confirmation & Interactive Pantry Checklist:**
   - Celebratory banner and hero card of tomorrow's locked dish.
   - **Interactive Pantry Audit:** Categorized checklist (Produce, Lentils & Grains, Spices, Dairy & Nuts, Oils, Pantry) to check off items before going to bed. Progress is saved locally.
   - Prominent prep heads-up alert.
   - "Unlock / Change Mind" button to reset the poll back to voting mode anytime.

4. **Morning Cooking Verification:**
   - When launching the app the next day, an actionable verification banner prompts:
     - *"Did you cook [Dish Name] this morning?"*
     - Options:
       - **"Yes, Cooked it!"** (Sets status to `cooked` and updates `last_cooked_at`).
       - **"Swapped with something else"** (Select what was actually prepared from a dropdown).
       - **"Skipped / Ate out"** (Sets status to `skipped`).

5. **Decision History & Adherence Analytics:**
   - Summary cards: Total breakfasts logged, Cooking Adherence Rate (%), and count of Swapped/Skipped meals.
   - Top 3 most prepared household favorite meals.
   - Chronological decision feed showing date, decided dish vs. actual dish cooked, voting breakdown (unanimous vs duel lock), and status badge.

6. **Progressive Web App (PWA) & Offline-First:**
   - Full PWA manifest (`name`, `short_name`, `theme_color`, icons).
   - Service worker with Workbox runtime caching for Unsplash food images and Supabase REST endpoints.
   - Installable on iOS (Safari Add to Home Screen) and Android (Chrome install banner).
   - Resilient offline fallback with localStorage persistence if Supabase credentials are not provided.

---

## 🚀 Getting Started

### 1. Run Locally
```bash
# Navigate to project directory
cd /Users/in45814549/.gemini/antigravity/scratch/breakfast-duel

# Install dependencies (already completed)
npm install

# Start development server
npm run dev
```

### 2. Connect Supabase (Optional for Multi-Device Realtime Sync)
The app runs out-of-the-box in local offline mode. To sync live between 2 different phones:

1. Create a project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard and run the script in:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Copy your project URL and anon public key and add them to `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Restart the dev server (`npm run dev`) or build for production (`npm run build`).

---

## 🗄️ Database Schema Summary

- **`household_profiles`**: Holds `id` ('user_1', 'user_2'), `display_name`, and `avatar_color`.
- **`dishes`**: Holds the 15 South Indian high-protein dishes with regional names, macros, tags, prep notes, ingredient JSON, and `last_cooked_at`.
- **`daily_poll`**: Target date (`YYYY-MM-DD`), `candidate_ids`, `votes` JSON, `locked_dish_id`, `locked_by`, `locked_at`, `cooking_status`, and `actual_dish_cooked`.
- **Realtime**: Enabled on `daily_poll` and `household_profiles`.
