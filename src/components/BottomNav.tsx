import React from 'react';

export type AppView = 'duel' | 'locked' | 'recipes' | 'history';

interface BottomNavProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  isLocked: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onChangeView,
  isLocked
}) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface border-t border-outline-variant/40 shadow-md">
      <div className="flex justify-around items-center h-16 max-w-[428px] mx-auto px-2">
        {/* 1. Duel Tab */}
        <button
          type="button"
          onClick={() => onChangeView('duel')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-[48px] transition-colors ${
            currentView === 'duel'
              ? 'text-primary font-bold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: currentView === 'duel' ? "'FILL' 1" : "'FILL' 0" }}
          >
            swords
          </span>
          <span className="font-label-md text-label-md">Duel</span>
        </button>

        {/* 2. Locked Tab */}
        <button
          type="button"
          onClick={() => onChangeView('locked')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-[48px] transition-colors relative ${
            currentView === 'locked'
              ? 'text-primary font-bold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: currentView === 'locked' ? "'FILL' 1" : "'FILL' 0" }}
          >
            lock
          </span>
          <span className="font-label-md text-label-md">Locked</span>
          {isLocked && currentView !== 'locked' && (
            <span className="absolute top-2 right-1/4 w-2 h-2 rounded-full bg-secondary ring-2 ring-surface" />
          )}
        </button>

        {/* 3. All Recipes Tab */}
        <button
          type="button"
          onClick={() => onChangeView('recipes')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-[48px] transition-colors ${
            currentView === 'recipes'
              ? 'text-primary font-bold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: currentView === 'recipes' ? "'FILL' 1" : "'FILL' 0" }}
          >
            menu_book
          </span>
          <span className="font-label-md text-label-md">Recipes</span>
        </button>

        {/* 4. History Tab */}
        <button
          type="button"
          onClick={() => onChangeView('history')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-[48px] transition-colors ${
            currentView === 'history'
              ? 'text-primary font-bold'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: currentView === 'history' ? "'FILL' 1" : "'FILL' 0" }}
          >
            analytics
          </span>
          <span className="font-label-md text-label-md">History</span>
        </button>
      </div>
    </nav>
  );
};
