import React, { useState, useMemo } from 'react';
import type { Dish } from '../types/database';

interface AllRecipesViewProps {
  allDishes: Dish[];
  onLockDish?: (dishId: string) => void;
}

export const AllRecipesView: React.FC<AllRecipesViewProps> = ({
  allDishes,
  onLockDish
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [expandedDishId, setExpandedDishId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'protein' | 'fiber' | 'time' | 'calories'>('protein');

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allDishes.forEach((d) => {
      d.tags?.forEach((t) => tags.add(t));
    });
    return ['All', ...Array.from(tags)];
  }, [allDishes]);

  // Filter & sort dishes
  const filteredDishes = useMemo(() => {
    return allDishes
      .filter((dish) => {
        const matchesQuery =
          !searchQuery.trim() ||
          dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dish.regional_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dish.ingredients.some((i) => i.item.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesTag =
          selectedTag === 'All' || dish.tags.includes(selectedTag);

        return matchesQuery && matchesTag;
      })
      .sort((a, b) => {
        if (sortBy === 'protein') return b.protein_grams - a.protein_grams;
        if (sortBy === 'fiber') return b.fiber_grams - a.fiber_grams;
        if (sortBy === 'time') return a.cook_time_mins - b.cook_time_mins;
        if (sortBy === 'calories') return a.calories_approx - b.calories_approx;
        return 0;
      });
  }, [allDishes, searchQuery, selectedTag, sortBy]);

  const toggleExpand = (dishId: string) => {
    setExpandedDishId(expandedDishId === dishId ? null : dishId);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-label-md text-label-md uppercase tracking-wider text-primary font-bold">
              Master Library
            </span>
            <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold">
              All South Indian Recipes ({allDishes.length})
            </h2>
          </div>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Curated high-protein, high-fiber, low-glycemic breakfast traditions.
        </p>
      </div>

      {/* Search Bar & Sort Dropdown */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by recipe, dal, millet..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-sm font-medium text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-2.5 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] shrink-0"
        >
          <option value="protein">Highest Protein</option>
          <option value="fiber">Highest Fiber</option>
          <option value="time">Quickest Prep</option>
          <option value="calories">Lowest Calories</option>
        </select>
      </div>

      {/* Tag Filters Horizontal Scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {allTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setSelectedTag(tag)}
            className={`px-3 py-1.5 rounded-full font-label-md text-label-md transition-all whitespace-nowrap min-h-[36px] flex items-center justify-center font-bold ${
              selectedTag === tag
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Recipes Cards List */}
      {filteredDishes.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-8 text-center space-y-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[36px] text-primary">dinner_dining</span>
          <p className="font-headline-sm text-sm font-bold text-on-surface">No recipes found matching &ldquo;{searchQuery}&rdquo;</p>
          <p className="font-body-sm text-xs">Try searching for other lentils, millets, or ingredients.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredDishes.map((dish) => {
            const isExpanded = expandedDishId === dish.id;

            return (
              <div
                key={dish.id}
                className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-outline-variant/40 flex flex-col gap-3 transition-all hover:shadow-md"
              >
                {/* Image & Scrim */}
                <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-surface-container">
                  <img
                    src={dish.image_url}
                    alt={dish.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                  {/* Regional name badge */}
                  {dish.regional_name && (
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-black/80 text-white shadow-md border border-white/20">
                        {dish.regional_name}
                      </span>
                    </div>
                  )}

                  {/* Cook time */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/80 text-white text-xs font-bold shadow-md border border-white/20">
                    <span className="material-symbols-outlined text-[14px] text-amber-400">schedule</span>
                    <span>{dish.cook_time_mins} mins</span>
                  </div>

                  {/* Macros on image bottom */}
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-md border border-white/20">
                      <span className="material-symbols-outlined text-[13px] text-white">eco</span>
                      <span className="text-white font-extrabold">{dish.protein_grams}g Protein</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-orange-700 text-white font-bold text-xs flex items-center gap-1 shadow-md border border-white/20">
                      <span className="material-symbols-outlined text-[13px] text-white">grain</span>
                      <span className="text-white font-extrabold">{dish.fiber_grams}g Fiber</span>
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        {dish.name}
                      </h3>
                      <div className="flex items-center gap-1 flex-wrap mt-1">
                        {dish.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="font-label-stat text-label-stat text-primary shrink-0">
                      ~{dish.calories_approx} kcal
                    </span>
                  </div>

                  {/* Prep heads up */}
                  {dish.prep_heads_up && (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-primary-fixed/40 text-on-primary-fixed text-xs">
                      <span className="material-symbols-outlined text-primary text-[18px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                        warning
                      </span>
                      <span className="font-label-md font-medium">{dish.prep_heads_up}</span>
                    </div>
                  )}
                </div>

                {/* Expandable Ingredients Accordion */}
                <div className="bg-surface-container-low rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleExpand(dish.id)}
                    className="w-full min-h-[44px] px-3 py-2 flex items-center justify-between text-left text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="font-label-md text-label-md font-bold">
                      View {dish.ingredients.length} Ingredients
                    </span>
                    <span
                      className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-1.5 animate-slide-down">
                      {dish.ingredients.map((ing, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-surface text-xs font-medium text-on-surface border border-outline-variant/30"
                        >
                          <span className="truncate pr-1">{ing.item}</span>
                          <span className="font-bold text-primary shrink-0 text-[11px]">
                            {ing.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions: Lock directly or Nominate */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  {onLockDish && (
                    <button
                      type="button"
                      onClick={() => onLockDish(dish.id)}
                      className="min-h-[44px] px-4 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">lock</span>
                      <span>Lock as Tomorrow&apos;s Breakfast</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
