import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { 
  DailyPoll, 
  Dish, 
  HouseholdProfile, 
  ProfileId, 
  CookingStatus 
} from './types/database';
import { 
  getTomorrowDateStr, 
  getProfiles, 
  saveProfile, 
  getActiveProfileId, 
  setActiveProfileId, 
  getDishes, 
  seedDishesIfSupabaseEmpty, 
  getDailyPoll, 
  rerollPollCandidates, 
  toggleVote, 
  directLockDish, 
  unlockDish, 
  getPendingMorningCheckIn, 
  submitCookingVerification, 
  getAllPollHistory, 
  subscribeToPollChanges, 
  subscribeToProfileChanges 
} from './lib/supabase';
import { Header } from './components/Header';
import { BottomNav, AppView } from './components/BottomNav';
import { NameCaptureModal } from './components/NameCaptureModal';
import { MorningCheckIn } from './components/MorningCheckIn';
import { DishCard } from './components/DishCard';
import { LockedDishView } from './components/LockedDishView';
import { HistoryView } from './components/HistoryView';
import { AllRecipesView } from './components/AllRecipesView';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';

const LS_USERNAME_INITIALIZED = 'bf_duel_username_initialized';

export const App: React.FC = () => {
  const targetDate = getTomorrowDateStr();

  // Core State
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<HouseholdProfile[]>([]);
  const [activeProfileId, setActiveProfile] = useState<ProfileId>('user_1');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('duel');

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [dailyPoll, setDailyPoll] = useState<DailyPoll | null>(null);
  const [pendingMorningPoll, setPendingMorningPoll] = useState<DailyPoll | null>(null);
  const [historyLogs, setHistoryLogs] = useState<DailyPoll[]>([]);
  const [isRerolling, setIsRerolling] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  }, []);

  // Trigger celebration confetti
  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#006c4a', '#8d4b00', '#a83300', '#82f5c1', '#ffdcc3']
      });
    } catch {
      // ignore
    }
  }, []);

  // Initial load
  useEffect(() => {
    let mounted = true;

    async function initApp() {
      setLoading(true);
      try {
        // 1. Load profiles & active profile
        const loadedProfiles = await getProfiles();
        const activeId = getActiveProfileId();

        // Check if user has initialized their username
        const hasCustomProfile = localStorage.getItem(LS_USERNAME_INITIALIZED) !== null;

        // 2. Seed and fetch dishes
        await seedDishesIfSupabaseEmpty();
        const loadedDishes = await getDishes();

        // 3. Fetch daily poll for tomorrow
        const poll = await getDailyPoll(targetDate, loadedDishes);

        // 4. Fetch pending morning check-in
        const pendingCheckIn = await getPendingMorningCheckIn();

        // 5. Fetch history logs
        const history = await getAllPollHistory();

        if (mounted) {
          setProfiles(loadedProfiles);
          setActiveProfile(activeId);
          setDishes(loadedDishes);
          setDailyPoll(poll);
          setPendingMorningPoll(pendingCheckIn);
          setHistoryLogs(history);

          // If fresh start (no username entered yet), show modal
          if (!hasCustomProfile) {
            setShowProfileModal(true);
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initApp();

    return () => {
      mounted = false;
    };
  }, [targetDate]);

  // Realtime subscriptions
  useEffect(() => {
    const unsubPoll = subscribeToPollChanges(targetDate, (updatedPoll) => {
      setDailyPoll((prev) => {
        if (!prev?.locked_dish_id && updatedPoll.locked_dish_id) {
          triggerConfetti();
          showToast('Breakfast locked in! Kitchen prep ready.');
        }
        return updatedPoll;
      });
    });

    const unsubProfiles = subscribeToProfileChanges((updatedProfiles) => {
      setProfiles(updatedProfiles);
    });

    return () => {
      unsubPoll();
      unsubProfiles();
    };
  }, [targetDate, triggerConfetti, showToast]);

  // Handle profile switch
  const handleSwitchProfile = (id: ProfileId) => {
    setActiveProfile(id);
    setActiveProfileId(id);
    const switchedName = profiles.find((p) => p.id === id)?.display_name || 'partner';
    showToast(`Switched device profile to ${switchedName}`);
  };

  // Handle saving profiles from modal
  const handleSaveProfiles = async (updatedProfiles: HouseholdProfile[], chosenActive: ProfileId) => {
    for (const p of updatedProfiles) {
      await saveProfile(p);
    }
    setProfiles(updatedProfiles);
    setActiveProfile(chosenActive);
    setActiveProfileId(chosenActive);
    localStorage.setItem(LS_USERNAME_INITIALIZED, 'true');
    setShowProfileModal(false);
    const myName = updatedProfiles.find((p) => p.id === chosenActive)?.display_name || 'Chef';
    showToast(`Welcome ${myName}! Ready for tomorrow's duel.`);
  };

  // Vote toggle
  const handleToggleVote = async (dishId: string) => {
    if (!dailyPoll) return;
    const { poll, autoLocked } = await toggleVote(
      targetDate,
      activeProfileId,
      dishId,
      dailyPoll
    );
    setDailyPoll(poll);
    if (autoLocked) {
      triggerConfetti();
      showToast('🎉 Mutual match! Breakfast automatically locked.');
    } else {
      showToast('Vote cast! Voting closes at 10:00 PM.');
    }
  };

  // Direct lock override
  const handleDirectLock = async (dishId: string) => {
    if (!dailyPoll) return;
    const locked = await directLockDish(
      targetDate,
      activeProfileId,
      dishId,
      dailyPoll
    );
    setDailyPoll(locked);
    triggerConfetti();
    const dishName = dishes.find((d) => d.id === dishId)?.name || 'Dish';
    showToast(`Locked: ${dishName}! Prep checklist ready.`);
  };

  // Unlock dish
  const handleUnlock = async () => {
    if (!dailyPoll) return;
    const unlocked = await unlockDish(targetDate, dailyPoll);
    setDailyPoll(unlocked);
    setCurrentView('duel');
    showToast('Poll reopened for tonight\'s duel!');
  };

  // Reroll 3 candidates
  const handleReroll = async () => {
    if (isRerolling) return;
    setIsRerolling(true);
    try {
      const rerolled = await rerollPollCandidates(targetDate, dishes);
      setDailyPoll(rerolled);
      showToast('Rolled 3 fresh contenders from your kitchen library!');
    } finally {
      setIsRerolling(false);
    }
  };

  // Morning verification response
  const handleMorningVerify = async (
    pollDate: string,
    status: CookingStatus,
    actualDishId?: string
  ) => {
    await submitCookingVerification(pollDate, status, actualDishId);
    setPendingMorningPoll(null);

    const messages: Record<string, string> = {
      cooked: 'Recorded! Great job starting the day fresh ✨',
      swapped: 'Swapped! Updated in your kitchen adherence log.',
      skipped: 'Skipped logged. We\'ll adjust tonight\'s duel.'
    };
    showToast(messages[status] || 'Updated!');

    const updatedHistory = await getAllPollHistory();
    setHistoryLogs(updatedHistory);
    const updatedDishes = await getDishes();
    setDishes(updatedDishes);
  };

  // Candidate dishes
  const candidateDishes = React.useMemo(() => {
    if (!dailyPoll || !dailyPoll.candidate_ids) return [];
    return dailyPoll.candidate_ids
      .map((id) => dishes.find((d) => d.id === id))
      .filter((d): d is Dish => Boolean(d));
  }, [dailyPoll, dishes]);

  const lockedDish = React.useMemo(() => {
    if (!dailyPoll || !dailyPoll.locked_dish_id) return null;
    return dishes.find((d) => d.id === dailyPoll.locked_dish_id) || null;
  }, [dailyPoll, dishes]);

  const resolvedLogsCount = historyLogs.filter(
    (h) => h.locked_dish_id && h.cooking_status && h.cooking_status !== 'pending'
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 text-on-surface">
        <div className="w-16 h-16 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center mb-4 shadow-md animate-bounce">
          <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            restaurant
          </span>
        </div>
        <div className="flex items-center gap-2 text-primary font-headline-sm font-bold text-base">
          <span>Setting up Breakfast Duel...</span>
        </div>
        <p className="font-body-sm text-xs text-on-surface-variant mt-1">
          Loading South Indian high-protein recipes
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Fixed Top Header */}
      <Header
        targetDate={targetDate}
        activeProfileId={activeProfileId}
        profiles={profiles}
        onSwitchProfile={handleSwitchProfile}
        onOpenProfileModal={() => setShowProfileModal(true)}
        currentView={currentView}
        onChangeView={(v) => setCurrentView(v)}
        historyCount={resolvedLogsCount}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 flex flex-col relative w-full max-w-[428px] mx-auto pt-20 pb-24 px-4 bg-surface">
        {/* Morning Check-In Banner (if there's an unresolved meal from today/yesterday) */}
        {pendingMorningPoll && (
          <MorningCheckIn
            pendingPoll={pendingMorningPoll}
            allDishes={dishes}
            onVerify={handleMorningVerify}
            onDismiss={() => setPendingMorningPoll(null)}
          />
        )}

        {/* View Routing */}
        {currentView === 'recipes' && (
          <AllRecipesView
            allDishes={dishes}
            onLockDish={(dishId) => {
              handleDirectLock(dishId);
              setCurrentView('locked');
            }}
          />
        )}

        {currentView === 'history' && (
          <HistoryView
            history={historyLogs}
            allDishes={dishes}
            profiles={profiles}
            onBackToDuel={() => setCurrentView('duel')}
          />
        )}

        {currentView === 'locked' && (
          <>
            {lockedDish && dailyPoll ? (
              <LockedDishView
                dish={lockedDish}
                poll={dailyPoll}
                profiles={profiles}
                onUnlock={handleUnlock}
              />
            ) : (
              <div className="bg-surface-container-lowest rounded-2xl p-8 text-center space-y-3 border border-outline-variant/40 my-auto">
                <span className="material-symbols-outlined text-[42px] text-primary">lock_open</span>
                <h3 className="font-headline-sm text-lg font-bold text-on-surface">No Breakfast Locked Yet</h3>
                <p className="font-body-sm text-xs text-on-surface-variant">
                  Vote with your partner in tonight&apos;s duel or pick a favorite from the recipe library.
                </p>
                <div className="flex items-center gap-2 justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentView('duel')}
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary font-label-lg font-bold text-xs"
                  >
                    Go to Tonight&apos;s Duel
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentView('recipes')}
                    className="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-label-lg font-bold text-xs"
                  >
                    Browse Recipes
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {currentView === 'duel' && (
          <>
            {/* If a dish is already locked, show prompt or card */}
            {lockedDish && dailyPoll ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-primary-fixed/60 border border-primary/30 p-3 rounded-2xl text-on-primary-fixed">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      verified
                    </span>
                    <span className="font-label-md font-bold text-xs">
                      {lockedDish.name} is locked for tomorrow!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentView('locked')}
                    className="px-3 py-1 bg-primary text-on-primary rounded-lg text-xs font-bold"
                  >
                    View Prep
                  </button>
                </div>

                <LockedDishView
                  dish={lockedDish}
                  poll={dailyPoll}
                  profiles={profiles}
                  onUnlock={handleUnlock}
                />
              </div>
            ) : (
              /* Nightly Duel Voting Feed */
              <div className="flex flex-col w-full pb-8">
                {/* Section Header */}
                <div className="flex items-center justify-between gap-2 mb-3 px-0.5">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold tracking-tight">
                      Tomorrow&apos;s Duel
                    </h2>
                    <p className="font-label-md text-label-md text-on-surface-variant">
                      Locking breakfast locks the overnight pantry prep
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-1.5 rounded-full shrink-0">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="font-label-md text-label-md text-on-surface-variant font-semibold">
                      10:00 PM cutoff
                    </span>
                  </div>
                </div>

                {/* 3-Card Voting Feed */}
                <div className="flex flex-col gap-3.5">
                  {candidateDishes.map((dish) => (
                    <DishCard
                      key={dish.id}
                      dish={dish}
                      currentPoll={dailyPoll!}
                      activeProfileId={activeProfileId}
                      profiles={profiles}
                      onToggleVote={handleToggleVote}
                      onDirectLock={handleDirectLock}
                    />
                  ))}
                </div>

                {/* Shuffle Trio Pill Button */}
                <div className="w-full flex justify-center mt-5 mb-2">
                  <button
                    type="button"
                    onClick={handleReroll}
                    disabled={isRerolling}
                    className="min-h-[48px] px-5 py-2.5 rounded-full bg-surface-container-high text-on-surface hover:bg-surface-variant font-label-lg text-label-lg font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-transform disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-primary text-[20px] ${isRerolling ? 'animate-spin' : ''}`}>
                      casino
                    </span>
                    <span>Shuffle Trio (Reroll Alternatives)</span>
                  </button>
                </div>

                {/* View all recipes prompt */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentView('recipes')}
                    className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">menu_book</span>
                    <span>Browse all {dishes.length} South Indian breakfast recipes &rarr;</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <BottomNav
        currentView={currentView}
        onChangeView={(v) => setCurrentView(v)}
        isLocked={Boolean(lockedDish)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 max-w-[380px] w-[90%] bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 z-50 animate-slide-up">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-secondary-fixed shrink-0 text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
            <span className="font-body-md text-xs font-medium truncate">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-inverse-on-surface/70 hover:text-inverse-on-surface min-h-[32px] min-w-[32px] flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Onboarding Username & Profile Capture Modal */}
      <NameCaptureModal
        isOpen={showProfileModal}
        profiles={profiles}
        activeProfileId={activeProfileId}
        canDismiss={localStorage.getItem(LS_USERNAME_INITIALIZED) !== null}
        onClose={() => setShowProfileModal(false)}
        onSaveProfiles={handleSaveProfiles}
      />

      {/* PWA Mobile Installation Prompt */}
      <PwaInstallPrompt />
    </div>
  );
};

export default App;
