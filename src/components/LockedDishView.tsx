import React, { useState, useEffect } from 'react';
import type { Dish, DailyPoll, HouseholdProfile } from '../types/database';

interface LockedDishViewProps {
  dish: Dish;
  poll: DailyPoll;
  profiles: HouseholdProfile[];
  onUnlock: () => void;
}

export const LockedDishView: React.FC<LockedDishViewProps> = ({
  dish,
  poll,
  profiles,
  onUnlock
}) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const storageKey = `bf_pantry_check_${poll.target_date}_${dish.id}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCheckedItems(JSON.parse(saved));
      } else {
        // Default check first item as ready
        setCheckedItems({ [dish.ingredients[0]?.item || '']: true });
      }
    } catch {
      // ignore
    }
  }, [storageKey, dish.ingredients]);

  const toggleItem = (itemName: string) => {
    const updated = { ...checkedItems, [itemName]: !checkedItems[itemName] };
    setCheckedItems(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Group ingredients by category
  const groupedIngredients = React.useMemo(() => {
    const groups: Record<string, typeof dish.ingredients> = {};
    dish.ingredients.forEach((ing) => {
      const cat = ing.category || 'Pantry';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ing);
    });
    return groups;
  }, [dish.ingredients]);

  const totalIngredients = dish.ingredients.length;
  const readyCount = Object.values(checkedItems).filter(Boolean).length;

  const lockedByName = React.useMemo(() => {
    if (poll.locked_by === 'unanimous') return 'Mutual Household Match';
    const profile = profiles.find((p) => p.id === poll.locked_by);
    return profile ? `Directly locked by ${profile.display_name}` : 'Direct Lock';
  }, [poll.locked_by, profiles]);

  const handleShareWhatsApp = () => {
    const missing = dish.ingredients.filter((ing) => !checkedItems[ing.item]);
    let text = `🥘 *Breakfast Duel: ${dish.name}*\nLocked for tomorrow morning!\n\n`;
    if (dish.prep_heads_up) {
      text += `⚠️ *Heads-up tonight:* ${dish.prep_heads_up}\n\n`;
    }
    if (missing.length > 0) {
      text += `🛒 *Missing Pantry Items to grab:*\n` + missing.map((m) => `• ${m.item} (${m.quantity})`).join('\n');
    } else {
      text += `✅ *All ${totalIngredients} pantry ingredients are ready to cook!*`;
    }
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col w-full pb-6 space-y-4 animate-fade-in">
      {/* 1. Locked Banner */}
      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-primary-fixed text-on-primary-fixed shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl shrink-0 select-none">🎉</span>
          <div className="flex flex-col min-w-0">
            <span className="font-headline-sm text-headline-sm tracking-tight truncate font-bold text-on-primary-fixed">
              Locked for Tomorrow!
            </span>
            <span className="font-label-md text-label-md text-on-primary-fixed-variant truncate">
              {lockedByName}
            </span>
          </div>
        </div>
        <span className="material-symbols-outlined text-primary text-[22px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
          verified
        </span>
      </div>

      {/* 2. Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest shadow-md flex flex-col border border-outline-variant/40">
        <div className="relative w-full aspect-[16/10] bg-surface-container overflow-hidden">
          <img
            src={dish.image_url}
            alt={dish.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

          {/* Overlays */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white shadow-sm border border-outline-variant/30">
            <span className="material-symbols-outlined text-[15px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              workspace_premium
            </span>
            <span className="font-label-md text-label-md text-on-surface uppercase tracking-wider font-bold">
              Tomorrow&apos;s Champion
            </span>
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-label-md font-label-md font-bold shadow-sm border border-secondary/20">
            <span className="material-symbols-outlined text-[14px]">bolt</span>
            <span>High Protein</span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 text-white flex flex-col">
            <h2 className="font-headline-md text-headline-md text-white font-bold drop-shadow-sm leading-tight">
              {dish.name}
            </h2>
            {dish.regional_name && (
              <p className="font-body-sm text-body-sm text-white/90 truncate drop-shadow-sm mt-0.5 italic">
                {dish.regional_name}
              </p>
            )}
          </div>
        </div>

        {/* Macro Trio Grid */}
        <div className="p-3.5 bg-surface-container-lowest">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col p-2.5 rounded-xl bg-surface-container-low text-on-surface">
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-md text-label-md text-on-surface-variant font-bold uppercase tracking-wider">
                  Protein
                </span>
                <span className="material-symbols-outlined text-secondary text-[16px]">eco</span>
              </div>
              <span className="font-label-stat text-label-stat font-bold text-secondary">
                {dish.protein_grams}g
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant mt-0.5">High power</span>
            </div>

            <div className="flex flex-col p-2.5 rounded-xl bg-surface-container-low text-on-surface">
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-md text-label-md text-on-surface-variant font-bold uppercase tracking-wider">
                  Fiber
                </span>
                <span className="material-symbols-outlined text-tertiary text-[16px]">grain</span>
              </div>
              <span className="font-label-stat text-label-stat font-bold text-tertiary">
                {dish.fiber_grams}g
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant mt-0.5">Gut friendly</span>
            </div>

            <div className="flex flex-col p-2.5 rounded-xl bg-surface-container-low text-on-surface">
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-md text-label-md text-on-surface-variant font-bold uppercase tracking-wider">
                  Energy
                </span>
                <span className="material-symbols-outlined text-primary text-[16px]">local_fire_department</span>
              </div>
              <span className="font-label-stat text-label-stat font-bold text-on-surface">
                {dish.calories_approx}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant mt-0.5">kcal</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Kitchen Prep Tonight Checklist */}
      <div className="p-3.5 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-3 border border-outline-variant/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">nightlight</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Kitchen Prep Tonight
            </h3>
          </div>
          <span className="font-label-md text-label-md px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface font-bold">
            {readyCount} / {totalIngredients} Ready
          </span>
        </div>

        {/* Prep Heads-up Alarm Box */}
        {dish.prep_heads_up && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-primary-fixed/40 text-on-primary-fixed">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="material-symbols-outlined text-primary text-[22px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                alarm
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-label-lg text-label-lg font-bold text-on-surface truncate">
                  {dish.prep_heads_up}
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant truncate">
                  Overnight preparation needed
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Categorized Checkbox Rows */}
        <div className="space-y-3 pt-1">
          {Object.entries(groupedIngredients).map(([category, items]) => (
            <div key={category} className="flex flex-col gap-1.5">
              <span className="font-label-md text-label-md text-on-surface-variant font-bold uppercase tracking-wider px-1">
                {category}
              </span>
              {items.map((ing, i) => {
                const isChecked = Boolean(checkedItems[ing.item]);
                return (
                  <label
                    key={i}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer min-h-[48px]"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleItem(ing.item)}
                      className="w-5 h-5 rounded accent-secondary shrink-0 cursor-pointer"
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className={`font-body-md text-body-md font-semibold text-on-surface truncate ${isChecked ? 'line-through opacity-60' : ''}`}>
                        {ing.item}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                        {ing.quantity}
                      </span>
                    </div>
                    {isChecked && (
                      <span className="material-symbols-outlined text-secondary text-[18px]">
                        check_circle
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons: WhatsApp Share & Unlock */}
      <div className="flex flex-col gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-secondary text-on-secondary font-label-lg text-label-lg font-bold shadow-md hover:bg-secondary/90 active:scale-[0.99] transition-transform min-h-[50px]"
        >
          <span className="material-symbols-outlined text-[20px]">share</span>
          <span>Send Missing Items to WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={onUnlock}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-surface-container-high text-on-surface font-label-lg text-label-lg font-semibold hover:bg-surface-container-highest active:scale-[0.99] transition-colors min-h-[46px]"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">sync</span>
          <span>Change Mind / Reroll Duel</span>
        </button>
      </div>
    </div>
  );
};
