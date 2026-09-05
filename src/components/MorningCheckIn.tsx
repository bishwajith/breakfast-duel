import React, { useState } from 'react';
import type { DailyPoll, Dish, CookingStatus } from '../types/database';

interface MorningCheckInProps {
  pendingPoll: DailyPoll;
  allDishes: Dish[];
  onVerify: (targetDate: string, status: CookingStatus, actualDishId?: string) => void;
  onDismiss?: () => void;
}

export const MorningCheckIn: React.FC<MorningCheckInProps> = ({
  pendingPoll,
  allDishes,
  onVerify,
  onDismiss
}) => {
  const [showSwapSelector, setShowSwapSelector] = useState(false);
  const [selectedSwapDishId, setSelectedSwapDishId] = useState<string>(
    pendingPoll.locked_dish_id || allDishes[0]?.id || ''
  );

  const lockedDish = allDishes.find((d) => d.id === pendingPoll.locked_dish_id);
  const dishName = lockedDish ? lockedDish.name : 'your decided breakfast';

  const handleYes = () => {
    onVerify(pendingPoll.target_date, 'cooked', pendingPoll.locked_dish_id || undefined);
  };

  const handleSwapConfirm = () => {
    if (!selectedSwapDishId) return;
    onVerify(pendingPoll.target_date, 'swapped', selectedSwapDishId);
    setShowSwapSelector(false);
  };

  const handleSkip = () => {
    onVerify(pendingPoll.target_date, 'skipped');
  };

  return (
    <section className="w-full mb-2 transition-all duration-300 animate-slide-down">
      <div className="bg-primary-fixed text-on-primary-fixed p-3.5 rounded-2xl shadow-sm flex flex-col gap-2.5 border border-primary/20">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              wb_sunny
            </span>
            <p className="font-headline-sm text-headline-sm text-on-primary-fixed font-bold leading-tight">
              Morning Check-In
            </p>
          </div>
          {onDismiss && (
            <button
              type="button"
              aria-label="Dismiss check-in"
              onClick={onDismiss}
              className="text-on-primary-fixed-variant hover:text-on-primary-fixed min-w-[32px] min-h-[32px] flex items-center justify-center -mr-1 -mt-1"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        <p className="font-body-md text-sm text-on-surface-variant font-medium">
          Did you make <span className="font-bold text-on-primary-fixed underline decoration-primary/40">{dishName}</span> this morning?
        </p>

        {!showSwapSelector ? (
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleYes}
              className="flex-1 min-h-[44px] bg-secondary text-on-secondary font-label-lg text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <span>Cooked!</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSwapSelector(true)}
              className="flex-1 min-h-[44px] bg-surface text-tertiary font-label-lg text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform border border-outline-variant/40"
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
              <span>Swapped</span>
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="min-h-[44px] px-3 text-on-surface-variant font-label-lg text-xs font-semibold hover:text-on-surface flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">coffee</span>
              <span>Skipped</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2 pt-1 border-t border-primary/20 animate-fade-in">
            <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">restaurant</span>
              <span>What did you make instead?</span>
            </label>
            <div className="relative">
              <select
                value={selectedSwapDishId}
                onChange={(e) => setSelectedSwapDishId(e.target.value)}
                className="w-full bg-surface-container-lowest border border-primary/40 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px]"
              >
                {allDishes.map((dish) => (
                  <option key={dish.id} value={dish.id}>
                    {dish.name} ({dish.protein_grams}g Protein)
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowSwapSelector(false)}
                className="py-1.5 px-3 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSwapConfirm}
                className="py-1.5 px-3.5 rounded-lg bg-primary text-on-primary font-bold text-xs shadow"
              >
                Save Swap
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
