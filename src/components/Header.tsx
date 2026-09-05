import React from 'react';
import type { HouseholdProfile, ProfileId } from '../types/database';
import type { AppView } from './BottomNav';

interface HeaderProps {
  targetDate: string; // YYYY-MM-DD
  activeProfileId: ProfileId;
  profiles: HouseholdProfile[];
  onSwitchProfile: (id: ProfileId) => void;
  onOpenProfileModal: () => void;
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  targetDate,
  activeProfileId,
  profiles,
  onSwitchProfile,
  onOpenProfileModal,
  currentView,
  onChangeView,
  historyCount
}) => {
  const formattedDate = React.useMemo(() => {
    try {
      const [year, month, day] = targetDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return targetDate;
    }
  }, [targetDate]);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0] || {
    id: 'user_1',
    display_name: 'Karthik',
    avatar_color: 'emerald'
  };

  const otherProfileId: ProfileId = activeProfileId === 'user_1' ? 'user_2' : 'user_1';

  const viewTitle = React.useMemo(() => {
    switch (currentView) {
      case 'locked':
        return 'Locked';
      case 'recipes':
        return 'Recipes';
      case 'history':
        return 'History';
      case 'duel':
      default:
        return 'Duel';
    }
  }, [currentView]);

  return (
    <header className="fixed top-0 inset-x-0 z-50 pt-safe bg-surface border-b border-outline-variant/40 shadow-sm">
      <div className="h-16 px-4 flex items-center justify-between max-w-[428px] mx-auto w-full gap-2">
        {/* Left: Logo & Profile Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onChangeView('duel')}
            className="flex items-center focus:outline-none"
            title="Breakfast Duel Home"
          >
            <img
              src="/assets/logo.png"
              alt="Breakfast Duel Logo"
              className="h-8 w-auto object-contain rounded"
              onError={(e) => {
                // Fallback to stylized SVG icon if PNG fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </button>

          {/* Profile Switcher Pill */}
          <div className="flex items-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors">
            <button
              type="button"
              onClick={() => onSwitchProfile(otherProfileId)}
              className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 min-h-[44px]"
              title={`Click to switch to ${profiles.find((p) => p.id === otherProfileId)?.display_name || 'partner'}`}
            >
              <div className="relative flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center justify-center shadow-sm">
                  {activeProfile.display_name.charAt(0).toUpperCase()}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-secondary ring-2 ring-surface-container" />
              </div>
              <span className="font-label-lg text-label-lg text-on-surface font-semibold max-w-[70px] truncate">
                {activeProfile.display_name}
              </span>
              <span className="material-symbols-outlined text-on-surface-variant text-[16px]">
                sync_alt
              </span>
            </button>
            <button
              type="button"
              onClick={onOpenProfileModal}
              title="Edit username or profiles"
              className="pr-2 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
            </button>
          </div>
        </div>

        {/* Center: View Title & Target Date */}
        <div className="flex flex-col items-center justify-center text-center flex-1 px-1 min-w-0">
          <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight truncate w-full font-bold">
            {viewTitle}
          </h1>
          <p className="font-label-md text-label-md text-on-surface-variant truncate w-full">
            Tomorrow&apos;s Duel • {formattedDate}
          </p>
        </div>

        {/* Right: Live Sync Badge & History Quick Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed/40 text-on-secondary-fixed min-h-[40px]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
            </span>
            <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold">
              Live
            </span>
          </div>

          <button
            type="button"
            onClick={() => onChangeView(currentView === 'history' ? 'duel' : 'history')}
            className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
              currentView === 'history'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'hover:bg-surface-container text-on-surface'
            }`}
            title="View cooking history & adherence"
          >
            <span className="material-symbols-outlined text-[22px]">history</span>
            {historyCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary font-label-md text-[10px] font-bold leading-none shadow-sm">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
