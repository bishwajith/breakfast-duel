import React, { useState } from 'react';
import type { DailyPoll, Dish, HouseholdProfile } from '../types/database';

interface HistoryViewProps {
  history: DailyPoll[];
  allDishes: Dish[];
  profiles: HouseholdProfile[];
  onBackToDuel: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  allDishes,
  profiles,
  onBackToDuel
}) => {
  const [filter, setFilter] = useState<'all' | 'cooked' | 'swapped' | 'skipped'>('all');

  const resolvedLogs = history.filter(
    (h) => h.locked_dish_id && h.cooking_status && h.cooking_status !== 'pending'
  );

  const totalLogged = resolvedLogs.length;
  const cookedCount = resolvedLogs.filter((h) => h.cooking_status === 'cooked').length;
  const swappedCount = resolvedLogs.filter((h) => h.cooking_status === 'swapped').length;
  const skippedCount = resolvedLogs.filter((h) => h.cooking_status === 'skipped').length;

  const adherenceRate = totalLogged > 0 ? Math.round((cookedCount / totalLogged) * 100) : 100;

  // Unanimous count
  const unanimousCount = resolvedLogs.filter((h) => h.locked_by === 'unanimous').length;
  const harmonyRate = totalLogged > 0 ? Math.round((unanimousCount / totalLogged) * 100) : 80;

  // Top staple dish
  const dishCounts: Record<string, number> = {};
  resolvedLogs.forEach((log) => {
    const dishId = log.cooking_status === 'swapped' ? log.actual_dish_cooked : log.locked_dish_id;
    if (dishId && log.cooking_status !== 'skipped') {
      dishCounts[dishId] = (dishCounts[dishId] || 0) + 1;
    }
  });

  const sortedDishes = Object.entries(dishCounts)
    .map(([id, count]) => ({
      dish: allDishes.find((d) => d.id === id),
      count
    }))
    .filter((e): e is { dish: Dish; count: number } => Boolean(e.dish))
    .sort((a, b) => b.count - a.count);

  const topDish = sortedDishes[0]?.dish;
  const topCount = sortedDishes[0]?.count || 1;

  const getProfileName = (id: string) => {
    const p = profiles.find((prof) => prof.id === id);
    return p ? p.display_name : id;
  };

  const formatLogDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const filteredLogs = resolvedLogs.filter((log) => {
    if (filter === 'all') return true;
    return log.cooking_status === filter;
  });

  return (
    <div className="flex flex-col w-full space-y-4 pb-8 animate-fade-in">
      {/* Header Sub-Bar with Navigation */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col">
          <span className="font-label-md text-label-md uppercase tracking-wider text-primary font-bold">
            Kitchen Records
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold">
            Household Adherence
          </h2>
        </div>
        <button
          type="button"
          onClick={onBackToDuel}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-xs font-bold transition-colors min-h-[40px] shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px] text-primary">arrow_back</span>
          <span>Back to Duel</span>
        </button>
      </div>

      {/* Bento Stat Trio */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Card 1: Logged Meals */}
        <div className="flex flex-col justify-between p-3 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <span className="w-7 h-7 rounded-full bg-primary-fixed/50 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[16px]">restaurant</span>
            </span>
            <span className="font-label-md text-label-md text-secondary font-bold">Total</span>
          </div>
          <div className="mt-2">
            <span className="font-headline-lg text-2xl text-on-surface font-extrabold tracking-tight">
              {totalLogged}
            </span>
            <p className="font-label-md text-label-md text-on-surface-variant leading-tight mt-0.5">
              Logged Meals
            </p>
          </div>
        </div>

        {/* Card 2: Adherence Rate */}
        <div className="flex flex-col justify-between p-3 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <span className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
            </span>
            <span className="font-label-md text-label-md text-secondary font-bold">Target</span>
          </div>
          <div className="mt-2">
            <span className="font-headline-lg text-2xl text-secondary font-extrabold tracking-tight">
              {adherenceRate}%
            </span>
            <p className="font-label-md text-label-md text-on-surface-variant leading-tight mt-0.5">
              Adherence
            </p>
          </div>
        </div>

        {/* Card 3: Top Staple */}
        <div className="flex flex-col justify-between p-3 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <span className="w-7 h-7 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed">
              <span className="material-symbols-outlined text-[16px]">emoji_events</span>
            </span>
            <span className="font-label-md text-label-md text-tertiary font-bold">{topCount}x</span>
          </div>
          <div className="mt-2 min-w-0">
            <span className="font-headline-sm text-sm text-on-surface font-bold truncate block">
              {topDish ? topDish.name.split(' ')[0] : 'Pesarattu'}
            </span>
            <p className="font-label-md text-label-md text-on-surface-variant leading-tight mt-0.5">
              Top Staple
            </p>
          </div>
        </div>
      </div>

      {/* Household Voting Harmony Card */}
      <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm border border-outline-variant/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-fixed text-primary">
              <span className="material-symbols-outlined text-[18px]">handshake</span>
            </span>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight">
                Voting Harmony
              </h3>
              <p className="font-body-sm text-xs text-on-surface-variant">
                {unanimousCount} unanimous mutual matches
              </p>
            </div>
          </div>
          <span className="font-headline-sm text-headline-sm text-primary font-extrabold">
            {harmonyRate}%
          </span>
        </div>

        {/* Dual Progress Bar */}
        <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden flex">
          <div
            className="bg-primary h-full rounded-l-full transition-all duration-700"
            style={{ width: `${harmonyRate}%` }}
          />
          <div
            className="bg-primary-fixed-dim h-full rounded-r-full transition-all duration-700"
            style={{ width: `${100 - harmonyRate}%` }}
          />
        </div>
      </div>

      {/* Filter Segmented Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-full bg-surface-container overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full font-label-lg text-label-lg transition-all whitespace-nowrap min-h-[40px] flex items-center justify-center font-bold ${
            filter === 'all'
              ? 'bg-inverse-surface text-inverse-on-surface shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          All ({totalLogged})
        </button>
        <button
          type="button"
          onClick={() => setFilter('cooked')}
          className={`px-3 py-1.5 rounded-full font-label-lg text-label-lg transition-all whitespace-nowrap min-h-[40px] flex items-center justify-center font-bold ${
            filter === 'cooked'
              ? 'bg-secondary text-on-secondary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Cooked ({cookedCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('swapped')}
          className={`px-3 py-1.5 rounded-full font-label-lg text-label-lg transition-all whitespace-nowrap min-h-[40px] flex items-center justify-center font-bold ${
            filter === 'swapped'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Swapped ({swappedCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('skipped')}
          className={`px-3 py-1.5 rounded-full font-label-lg text-label-lg transition-all whitespace-nowrap min-h-[40px] flex items-center justify-center font-bold ${
            filter === 'skipped'
              ? 'bg-outline text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Skipped ({skippedCount})
        </button>
      </div>

      {/* Timeline Feed */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 text-center text-on-surface-variant text-xs">
            No breakfast logs in this filter category yet.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const decidedDish = allDishes.find((d) => d.id === log.locked_dish_id);
            const actualDish = log.actual_dish_cooked
              ? allDishes.find((d) => d.id === log.actual_dish_cooked)
              : decidedDish;

            const isCooked = log.cooking_status === 'cooked';
            const isSwapped = log.cooking_status === 'swapped';

            return (
              <div
                key={log.target_date}
                className="rounded-2xl bg-surface-container-lowest p-3.5 shadow-sm border border-outline-variant/30 space-y-2.5 transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isCooked ? 'bg-secondary' : isSwapped ? 'bg-primary' : 'bg-outline'
                      }`}
                    />
                    <span className="font-label-lg text-label-lg font-bold text-on-surface">
                      {formatLogDate(log.target_date)}
                    </span>
                  </div>

                  {isCooked && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary text-on-secondary font-label-md text-label-md font-bold shadow-sm">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      <span>Cooked</span>
                    </span>
                  )}
                  {isSwapped && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-md text-label-md font-bold shadow-sm">
                      <span className="material-symbols-outlined text-[13px]">swap_horiz</span>
                      <span>Swapped</span>
                    </span>
                  )}
                  {log.cooking_status === 'skipped' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-md text-label-md font-bold">
                      <span className="material-symbols-outlined text-[13px]">coffee</span>
                      <span>Skipped</span>
                    </span>
                  )}
                </div>

                {decidedDish && (
                  <div className="flex gap-3 items-center">
                    <img
                      src={decidedDish.image_url}
                      alt={decidedDish.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">
                        {isSwapped && actualDish ? actualDish.name : decidedDish.name}
                      </h4>
                      {isSwapped && (
                        <p className="font-body-sm text-xs text-on-surface-variant truncate">
                          Planned: {decidedDish.name}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container font-label-md text-[10px] font-semibold text-on-surface-variant">
                          <span className="material-symbols-outlined text-[12px] text-secondary">
                            how_to_vote
                          </span>
                          {log.locked_by === 'unanimous'
                            ? 'Unanimous Match'
                            : `Decided by ${getProfileName(log.locked_by || 'partner')}`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {decidedDish && (
                  <div className="flex items-center justify-between pt-1 font-label-md text-label-md text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-xl">
                    <span className="flex items-center gap-1 font-semibold text-secondary">
                      <span className="material-symbols-outlined text-[14px]">eco</span>
                      {decidedDish.protein_grams}g Protein
                    </span>
                    <span className="text-outline-variant">•</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">bolt</span>
                      {decidedDish.calories_approx} kcal
                    </span>
                    <span className="text-outline-variant">•</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {decidedDish.cook_time_mins}m prep
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
