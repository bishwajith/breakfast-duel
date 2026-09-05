import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import type { DailyPoll, Dish, HouseholdProfile, CookingStatus, ProfileId } from '../types/database';
import initialRecipes from '../data/recipes.json';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  supabaseUrl.startsWith('https://')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// LocalStorage keys for offline fallback mode
const LS_PROFILES = 'bf_duel_profiles';
const LS_DISHES = 'bf_duel_dishes';
const LS_POLLS = 'bf_duel_polls';
const LS_ACTIVE_PROFILE = 'bf_duel_active_profile_id';

const DEFAULT_PROFILES: HouseholdProfile[] = [
  { id: 'user_1', display_name: 'Partner 1', avatar_color: 'emerald' },
  { id: 'user_2', display_name: 'Partner 2', avatar_color: 'amber' },
];

// Helper to get tomorrow's date string YYYY-MM-DD
export function getTomorrowDateStr(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

// Helper to get today's date string YYYY-MM-DD
export function getTodayDateStr(): string {
  return new Date().toISOString().split('T')[0];
}

// Helper to get yesterday's date string YYYY-MM-DD
export function getYesterdayDateStr(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

// In-memory event listeners for local mock real-time simulation
type PollListener = (poll: DailyPoll) => void;
type ProfileListener = (profiles: HouseholdProfile[]) => void;
const localPollListeners = new Set<PollListener>();
const localProfileListeners = new Set<ProfileListener>();

function notifyLocalPoll(poll: DailyPoll) {
  localPollListeners.forEach((listener) => listener(poll));
}

function notifyLocalProfiles(profiles: HouseholdProfile[]) {
  localProfileListeners.forEach((listener) => listener(profiles));
}

// ----------------- Profiles Management -----------------
export async function getProfiles(): Promise<HouseholdProfile[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('household_profiles').select('*');
      if (!error && data && data.length > 0) {
        return data as HouseholdProfile[];
      }
    } catch (e) {
      console.warn('Failed to load profiles from Supabase, falling back to local storage', e);
    }
  }

  const stored = localStorage.getItem(LS_PROFILES);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback below
    }
  }
  localStorage.setItem(LS_PROFILES, JSON.stringify(DEFAULT_PROFILES));
  return DEFAULT_PROFILES;
}

export async function saveProfile(profile: HouseholdProfile): Promise<void> {
  if (supabase) {
    try {
      await supabase.from('household_profiles').upsert(profile);
    } catch (e) {
      console.warn('Failed to save profile to Supabase', e);
    }
  }

  const profiles = await getProfiles();
  const idx = profiles.findIndex((p) => p.id === profile.id);
  if (idx >= 0) {
    profiles[idx] = profile;
  } else {
    profiles.push(profile);
  }
  localStorage.setItem(LS_PROFILES, JSON.stringify(profiles));
  notifyLocalProfiles(profiles);
}

export function getActiveProfileId(): ProfileId {
  const stored = localStorage.getItem(LS_ACTIVE_PROFILE);
  if (stored === 'user_1' || stored === 'user_2') {
    return stored;
  }
  return 'user_1';
}

export function setActiveProfileId(id: ProfileId): void {
  localStorage.setItem(LS_ACTIVE_PROFILE, id);
}

// ----------------- Dishes Management -----------------
export async function getDishes(): Promise<Dish[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('dishes').select('*');
      if (!error && data && data.length > 0) {
        return data as Dish[];
      }
    } catch (e) {
      console.warn('Failed to load dishes from Supabase', e);
    }
  }

  const stored = localStorage.getItem(LS_DISHES);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }

  const seed = initialRecipes as Dish[];
  localStorage.setItem(LS_DISHES, JSON.stringify(seed));
  return seed;
}

export async function seedDishesIfSupabaseEmpty(): Promise<void> {
  if (!supabase) return;
  try {
    const { count } = await supabase.from('dishes').select('*', { count: 'exact', head: true });
    if (!count || count === 0) {
      console.info('Seeding dishes table in Supabase from recipes.json...');
      await supabase.from('dishes').upsert(initialRecipes);
    }
  } catch (err) {
    console.warn('Supabase dishes seeding skipped or errored:', err);
  }
}

// ----------------- Candidate Selection -----------------
export function pickRandomCandidates(allDishes: Dish[], count = 3): string[] {
  // Exclude dishes cooked within the last 3 days
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const cutoffStr = threeDaysAgo.toISOString().split('T')[0];

  const eligible = allDishes.filter((d) => {
    if (!d.last_cooked_at) return true;
    return d.last_cooked_at < cutoffStr;
  });

  const pool = eligible.length >= count ? eligible : allDishes;
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((d) => d.id);
}

// ----------------- Daily Poll Management -----------------
function getLocalPolls(): Record<string, DailyPoll> {
  const stored = localStorage.getItem(LS_POLLS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  // Initialize with some sample past history for a richer first-time view!
  const todayStr = getTodayDateStr();
  const yesterdayStr = getYesterdayDateStr();
  const samplePolls: Record<string, DailyPoll> = {
    [yesterdayStr]: {
      target_date: yesterdayStr,
      candidate_ids: ['moong-dal-pesarattu', 'ragi-masala-rotti', 'foxtail-millet-pongal'],
      votes: { user_1: 'moong-dal-pesarattu', user_2: 'moong-dal-pesarattu' },
      locked_dish_id: 'moong-dal-pesarattu',
      locked_by: 'user_1',
      locked_at: new Date(Date.now() - 86400000).toISOString(),
      cooking_status: 'cooked',
      actual_dish_cooked: 'moong-dal-pesarattu',
      notes: 'Crispy with ginger chutney'
    },
    [todayStr]: {
      target_date: todayStr,
      candidate_ids: ['multi-lentil-adai', 'sprouted-moong-upma', 'oats-flaxseed-idli'],
      votes: { user_1: 'multi-lentil-adai', user_2: 'multi-lentil-adai' },
      locked_dish_id: 'multi-lentil-adai',
      locked_by: 'user_2',
      locked_at: new Date().toISOString(),
      cooking_status: 'pending', // Triggers morning check-in!
      actual_dish_cooked: null
    }
  };
  localStorage.setItem(LS_POLLS, JSON.stringify(samplePolls));
  return samplePolls;
}

function saveLocalPoll(poll: DailyPoll) {
  const polls = getLocalPolls();
  polls[poll.target_date] = poll;
  localStorage.setItem(LS_POLLS, JSON.stringify(polls));
  notifyLocalPoll(poll);
}

export async function getDailyPoll(targetDate: string, allDishes: Dish[]): Promise<DailyPoll> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('daily_poll')
        .select('*')
        .eq('target_date', targetDate)
        .single();

      if (!error && data) {
        return data as DailyPoll;
      }
    } catch (e) {
      console.warn('Failed to load daily poll from Supabase, checking local storage', e);
    }
  }

  // Fallback to local storage
  const polls = getLocalPolls();
  if (polls[targetDate]) {
    return polls[targetDate];
  }

  // Create new poll for target date
  const candidateIds = pickRandomCandidates(allDishes, 3);
  const newPoll: DailyPoll = {
    target_date: targetDate,
    candidate_ids: candidateIds,
    votes: {},
    locked_dish_id: null,
    locked_by: null,
    locked_at: null,
    cooking_status: 'pending',
    actual_dish_cooked: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      await supabase.from('daily_poll').insert(newPoll);
    } catch (err) {
      console.warn('Supabase insert poll error:', err);
    }
  }

  saveLocalPoll(newPoll);
  return newPoll;
}

export async function rerollPollCandidates(targetDate: string, allDishes: Dish[]): Promise<DailyPoll> {
  const candidateIds = pickRandomCandidates(allDishes, 3);
  const updatePayload: Partial<DailyPoll> = {
    candidate_ids: candidateIds,
    votes: {},
    locked_dish_id: null,
    locked_by: null,
    locked_at: null,
    updated_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data } = await supabase
        .from('daily_poll')
        .update(updatePayload)
        .eq('target_date', targetDate)
        .select()
        .single();
      if (data) return data as DailyPoll;
    } catch (e) {
      console.warn('Failed to reroll in Supabase', e);
    }
  }

  const polls = getLocalPolls();
  const current = polls[targetDate] || {
    target_date: targetDate,
    cooking_status: 'pending',
    actual_dish_cooked: null
  };
  const updated: DailyPoll = {
    ...current,
    ...updatePayload,
    candidate_ids: candidateIds,
    votes: {},
    locked_dish_id: null,
    locked_by: null,
    locked_at: null,
  };
  saveLocalPoll(updated);
  return updated;
}

export async function toggleVote(
  targetDate: string,
  profileId: ProfileId,
  dishId: string,
  currentPoll: DailyPoll
): Promise<{ poll: DailyPoll; autoLocked: boolean }> {
  const newVotes = { ...currentPoll.votes };

  if (newVotes[profileId] === dishId) {
    delete newVotes[profileId];
  } else {
    newVotes[profileId] = dishId;
  }

  // Check for unanimous vote between user_1 and user_2
  const otherUser = profileId === 'user_1' ? 'user_2' : 'user_1';
  const otherVote = newVotes[otherUser];
  const isUnanimous = Boolean(newVotes[profileId] && otherVote && newVotes[profileId] === otherVote);

  const updatePayload: Partial<DailyPoll> = {
    votes: newVotes,
    locked_dish_id: isUnanimous ? dishId : currentPoll.locked_dish_id,
    locked_by: isUnanimous ? 'unanimous' : currentPoll.locked_by,
    locked_at: isUnanimous ? new Date().toISOString() : currentPoll.locked_at,
    updated_at: new Date().toISOString()
  };

  let updatedPoll: DailyPoll = {
    ...currentPoll,
    ...updatePayload,
    votes: newVotes,
    locked_dish_id: isUnanimous ? dishId : currentPoll.locked_dish_id,
    locked_by: isUnanimous ? 'unanimous' : currentPoll.locked_by,
    locked_at: isUnanimous ? new Date().toISOString() : currentPoll.locked_at,
  };

  if (supabase) {
    try {
      const { data } = await supabase
        .from('daily_poll')
        .update(updatePayload)
        .eq('target_date', targetDate)
        .select()
        .single();
      if (data) updatedPoll = data as DailyPoll;
    } catch (e) {
      console.warn('Supabase vote error, saving locally:', e);
    }
  }

  saveLocalPoll(updatedPoll);
  return { poll: updatedPoll, autoLocked: isUnanimous };
}

export async function directLockDish(
  targetDate: string,
  profileId: ProfileId,
  dishId: string,
  currentPoll: DailyPoll
): Promise<DailyPoll> {
  const updatePayload: Partial<DailyPoll> = {
    locked_dish_id: dishId,
    locked_by: profileId,
    locked_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  let updatedPoll: DailyPoll = {
    ...currentPoll,
    ...updatePayload,
    locked_dish_id: dishId,
    locked_by: profileId,
    locked_at: updatePayload.locked_at!
  };

  if (supabase) {
    try {
      const { data } = await supabase
        .from('daily_poll')
        .update(updatePayload)
        .eq('target_date', targetDate)
        .select()
        .single();
      if (data) updatedPoll = data as DailyPoll;
    } catch (e) {
      console.warn('Supabase lock error:', e);
    }
  }

  saveLocalPoll(updatedPoll);
  return updatedPoll;
}

export async function unlockDish(targetDate: string, currentPoll: DailyPoll): Promise<DailyPoll> {
  const updatePayload: Partial<DailyPoll> = {
    locked_dish_id: null,
    locked_by: null,
    locked_at: null,
    updated_at: new Date().toISOString()
  };

  let updatedPoll: DailyPoll = {
    ...currentPoll,
    ...updatePayload,
    locked_dish_id: null,
    locked_by: null,
    locked_at: null
  };

  if (supabase) {
    try {
      const { data } = await supabase
        .from('daily_poll')
        .update(updatePayload)
        .eq('target_date', targetDate)
        .select()
        .single();
      if (data) updatedPoll = data as DailyPoll;
    } catch (e) {
      console.warn('Supabase unlock error:', e);
    }
  }

  saveLocalPoll(updatedPoll);
  return updatedPoll;
}

// ----------------- Morning Verification -----------------
export async function getPendingMorningCheckIn(): Promise<DailyPoll | null> {
  // Check today's date first, then yesterday's
  const todayStr = getTodayDateStr();
  const yesterdayStr = getYesterdayDateStr();

  if (supabase) {
    try {
      const { data } = await supabase
        .from('daily_poll')
        .select('*')
        .in('target_date', [todayStr, yesterdayStr])
        .eq('cooking_status', 'pending')
        .not('locked_dish_id', 'is', null)
        .order('target_date', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        return data[0] as DailyPoll;
      }
    } catch (e) {
      console.warn('Supabase pending check-in check failed:', e);
    }
  }

  const polls = getLocalPolls();
  for (const dateKey of [todayStr, yesterdayStr]) {
    const poll = polls[dateKey];
    if (poll && poll.locked_dish_id && poll.cooking_status === 'pending') {
      return poll;
    }
  }
  return null;
}

export async function submitCookingVerification(
  targetDate: string,
  status: CookingStatus,
  actualDishId?: string
): Promise<void> {
  const cookedDishId = actualDishId;
  const updatePayload: Partial<DailyPoll> = {
    cooking_status: status,
    actual_dish_cooked: status === 'skipped' ? null : cookedDishId,
    updated_at: new Date().toISOString()
  };

  // If cooked, update dish's last_cooked_at
  if (status === 'cooked' && cookedDishId) {
    if (supabase) {
      try {
        await supabase
          .from('dishes')
          .update({ last_cooked_at: targetDate })
          .eq('id', cookedDishId);
      } catch (err) {
        console.warn('Supabase update last_cooked_at error:', err);
      }
    }
    const storedDishes = localStorage.getItem(LS_DISHES);
    if (storedDishes) {
      try {
        const dishesList: Dish[] = JSON.parse(storedDishes);
        const dishObj = dishesList.find((d) => d.id === cookedDishId);
        if (dishObj) {
          dishObj.last_cooked_at = targetDate;
          localStorage.setItem(LS_DISHES, JSON.stringify(dishesList));
        }
      } catch {
        // ignore
      }
    }
  }

  if (supabase) {
    try {
      await supabase
        .from('daily_poll')
        .update(updatePayload)
        .eq('target_date', targetDate);
    } catch (e) {
      console.warn('Supabase verification error:', e);
    }
  }

  const polls = getLocalPolls();
  if (polls[targetDate]) {
    const updated: DailyPoll = {
      ...polls[targetDate],
      ...updatePayload,
      cooking_status: status,
      actual_dish_cooked: updatePayload.actual_dish_cooked || null
    };
    saveLocalPoll(updated);
  }
}

// ----------------- History & Analytics -----------------
export async function getAllPollHistory(): Promise<DailyPoll[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('daily_poll')
        .select('*')
        .order('target_date', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as DailyPoll[];
      }
    } catch (e) {
      console.warn('Supabase fetch history error:', e);
    }
  }

  const polls = getLocalPolls();
  return Object.values(polls).sort((a, b) => b.target_date.localeCompare(a.target_date));
}

// ----------------- Realtime Subscriptions -----------------
export function subscribeToPollChanges(
  targetDate: string,
  onUpdate: (poll: DailyPoll) => void
): () => void {
  // Local subscription
  const localHandler = (poll: DailyPoll) => {
    if (poll.target_date === targetDate) {
      onUpdate(poll);
    }
  };
  localPollListeners.add(localHandler);

  let channel: RealtimeChannel | null = null;
  if (supabase) {
    try {
      channel = supabase
        .channel(`public:daily_poll:${targetDate}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'daily_poll', filter: `target_date=eq.${targetDate}` },
          (payload) => {
            if (payload.new) {
              onUpdate(payload.new as DailyPoll);
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Error subscribing to Supabase realtime:', err);
    }
  }

  return () => {
    localPollListeners.delete(localHandler);
    if (channel && supabase) {
      supabase.removeChannel(channel);
    }
  };
}

export function subscribeToProfileChanges(onUpdate: (profiles: HouseholdProfile[]) => void): () => void {
  localProfileListeners.add(onUpdate);

  let channel: RealtimeChannel | null = null;
  if (supabase) {
    try {
      channel = supabase
        .channel('public:household_profiles')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'household_profiles' },
          async () => {
            const updated = await getProfiles();
            onUpdate(updated);
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Error subscribing to profiles channel:', err);
    }
  }

  return () => {
    localProfileListeners.delete(onUpdate);
    if (channel && supabase) {
      supabase.removeChannel(channel);
    }
  };
}
