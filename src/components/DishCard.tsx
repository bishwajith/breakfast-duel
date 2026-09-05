import React, { useState } from 'react';
import type { Dish, HouseholdProfile, ProfileId, DailyPoll } from '../types/database';

interface DishCardProps {
  dish: Dish;
  currentPoll: DailyPoll;
  activeProfileId: ProfileId;
  profiles: HouseholdProfile[];
  onToggleVote: (dishId: string) => void;
  onDirectLock: (dishId: string) => void;
}

export const DishCard: React.FC<DishCardProps> = ({
  dish,
  currentPoll,
  activeProfileId,
  profiles,
  onToggleVote,
  onDirectLock
}) => {
  const [showIngredients, setShowIngredients] = useState(false);
  const [imgError, setImgError] = useState(false);

  const votes = currentPoll.votes || {};
  const voters = Object.entries(votes)
    .filter(([_, votedDishId]) => votedDishId === dish.id)
    .map(([userId]) => profiles.find((p) => p.id === userId))
    .filter(Boolean) as HouseholdProfile[];

  const isCurrentVoted = votes[activeProfileId] === dish.id;
  const voteCount = voters.length;
  const isConsensus = voteCount >= 2;

  const fallbackImg = 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80';

  return (
    <div
      className={`bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border transition-all duration-200 flex flex-col gap-3 relative ${
        isCurrentVoted
          ? 'border-primary ring-1 ring-primary/40 shadow-md'
          : 'border-outline-variant/40 hover:shadow-md'
      }`}
    >
      {/* Media Frame with Overlays */}
      <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-surface-container">
        <img
          src={imgError ? fallbackImg : dish.image_url}
          alt={dish.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
          {isConsensus ? (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-on-secondary text-label-md font-label-md font-bold shadow-sm">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                hotel_class
              </span>
              <span>Household Pick (2 Votes)</span>
            </div>
          ) : dish.regional_name ? (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-primary text-label-md font-label-md font-bold shadow-sm border border-outline-variant/30">
              <span>{dish.regional_name}</span>
            </div>
          ) : <span />}

          {/* Prep Time Badge */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white text-on-surface text-label-md font-label-md font-bold shadow-sm border border-outline-variant/30 shrink-0">
            <span className="material-symbols-outlined text-[14px] text-primary">timer</span>
            <span>{dish.cook_time_mins} mins prep</span>
          </div>
        </div>

        {/* Macro badges inside hero bottom */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-secondary-container text-on-secondary-container font-label-md text-label-md font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">eco</span>
            {dish.protein_grams}g Protein
          </span>
          <span className="px-2 py-0.5 rounded-md bg-tertiary-fixed text-on-tertiary-fixed font-label-md text-label-md font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">grain</span>
            {dish.fiber_grams}g Fiber
          </span>
        </div>
      </div>

      {/* Dish Details */}
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              {dish.name}
            </h3>
            {dish.regional_name && (
              <p className="font-body-sm text-body-sm text-on-surface-variant italic">
                {dish.regional_name}
              </p>
            )}
          </div>
          <span className="font-label-stat text-label-stat text-primary shrink-0">
            ~{dish.calories_approx} kcal
          </span>
        </div>

        {/* Overnight Warning Tag */}
        {dish.prep_heads_up && (
          <div className="mt-1 flex items-center gap-2 p-2 rounded-xl bg-primary-fixed/40 text-on-primary-fixed">
            <span className="material-symbols-outlined text-primary text-[18px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
              warning
            </span>
            <span className="font-label-md text-label-md font-medium">
              {dish.prep_heads_up}
            </span>
          </div>
        )}
      </div>

      {/* Collapsible Ingredients Accordion */}
      <div className="bg-surface-container-low rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowIngredients(!showIngredients)}
          className="w-full min-h-[44px] px-3 py-2 flex items-center justify-between text-left text-on-surface-variant hover:text-on-surface"
        >
          <span className="font-label-md text-label-md font-bold">
            View {dish.ingredients.length} Key Ingredients
          </span>
          <span
            className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
              showIngredients ? 'rotate-180' : ''
            }`}
          >
            expand_more
          </span>
        </button>

        {showIngredients && (
          <div className="px-3 pb-3 pt-0 flex flex-wrap gap-1.5 animate-slide-down">
            {dish.ingredients.map((ing, i) => (
              <span
                key={i}
                className="px-2 py-1 rounded-lg bg-surface text-on-surface text-label-md font-label-md border border-outline-variant/30 flex items-center gap-1"
              >
                <span>{ing.item}</span>
                <span className="font-bold text-primary text-[10px]">({ing.quantity})</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Live Decision Action Bar */}
      <div className="flex items-center justify-between pt-1 gap-2">
        {/* Household Avatar Vote Indicators */}
        <div className="flex items-center gap-1.5 min-w-0">
          {voters.length > 0 ? (
            <>
              <div className="flex -space-x-2 overflow-hidden items-center">
                {voters.map((v) => (
                  <span
                    key={v.id}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-fixed text-primary font-bold text-xs shadow-sm ring-2 ring-surface-container-lowest"
                    title={`${v.display_name} voted`}
                  >
                    {v.display_name.charAt(0).toUpperCase()}
                  </span>
                ))}
              </div>
              <span className="font-label-md text-label-md text-on-surface-variant font-medium truncate">
                {isConsensus ? 'Consensus' : `${voters.map((v) => v.display_name).join(', ')}`}
              </span>
            </>
          ) : (
            <div className="flex items-center gap-1 text-on-surface-variant text-xs font-medium">
              <span className="material-symbols-outlined text-[16px]">how_to_vote</span>
              <span>0 votes yet</span>
            </div>
          )}
        </div>

        {/* Action Buttons: Vote & Direct Lock */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Vote Button */}
          <button
            type="button"
            aria-label={`Vote for ${dish.name}`}
            onClick={() => onToggleVote(dish.id)}
            className={`min-h-[48px] min-w-[48px] px-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
              isCurrentVoted
                ? 'bg-tertiary-fixed text-tertiary font-bold shadow-sm'
                : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface'
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px] text-tertiary"
              style={{ fontVariationSettings: isCurrentVoted ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>
            <span className="font-label-lg text-label-lg font-bold">{voteCount}</span>
          </button>

          {/* Lock In Button */}
          <button
            type="button"
            aria-label={`Lock in ${dish.name}`}
            onClick={() => onDirectLock(dish.id)}
            className="min-h-[48px] px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">lock</span>
            <span>Lock In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
