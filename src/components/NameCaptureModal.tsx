import React, { useState } from 'react';
import type { HouseholdProfile, ProfileId } from '../types/database';

interface NameCaptureModalProps {
  isOpen: boolean;
  profiles: HouseholdProfile[];
  activeProfileId: ProfileId;
  onSaveProfiles: (updatedProfiles: HouseholdProfile[], chosenActiveId: ProfileId) => void;
  canDismiss?: boolean;
  onClose?: () => void;
}

const COLOR_OPTIONS = [
  { id: 'amber', label: 'Turmeric (Amber)', bg: 'bg-primary' },
  { id: 'emerald', label: 'Curry Leaf (Emerald)', bg: 'bg-secondary' },
  { id: 'terracotta', label: 'Terracotta (Red)', bg: 'bg-tertiary' },
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-600' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-500' },
];

export const NameCaptureModal: React.FC<NameCaptureModalProps> = ({
  isOpen,
  profiles,
  activeProfileId,
  onSaveProfiles,
  canDismiss = false,
  onClose
}) => {
  // Current user's slot (user_1 or user_2)
  const [selectedSlot, setSelectedSlot] = useState<ProfileId>(activeProfileId || 'user_1');

  // Find existing profile for selected slot
  const currentSlotProfile = profiles.find((p) => p.id === selectedSlot);

  // Single name input for the user
  const [userName, setUserName] = useState(
    currentSlotProfile?.display_name && currentSlotProfile.display_name !== 'Partner 1' && currentSlotProfile.display_name !== 'Partner 2'
      ? currentSlotProfile.display_name
      : ''
  );

  const [avatarColor, setAvatarColor] = useState(
    currentSlotProfile?.avatar_color || (selectedSlot === 'user_1' ? 'amber' : 'emerald')
  );

  // Optional partner name toggle (for when user explicitly wants to set partner name too)
  const [showPartnerField, setShowPartnerField] = useState(false);
  const otherSlot: ProfileId = selectedSlot === 'user_1' ? 'user_2' : 'user_1';
  const otherSlotProfile = profiles.find((p) => p.id === otherSlot);
  const [partnerName, setPartnerName] = useState(otherSlotProfile?.display_name || 'Partner 2');

  if (!isOpen) return null;

  const handleSlotChange = (slot: ProfileId) => {
    setSelectedSlot(slot);
    const p = profiles.find((prof) => prof.id === slot);
    if (p && p.display_name !== 'Partner 1' && p.display_name !== 'Partner 2') {
      setUserName(p.display_name);
    } else {
      setUserName('');
    }
    if (p?.avatar_color) {
      setAvatarColor(p.avatar_color);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = userName.trim() || (selectedSlot === 'user_1' ? 'Partner 1' : 'Partner 2');
    const existingOther = profiles.find((p) => p.id === otherSlot);

    const updated: HouseholdProfile[] = [
      {
        id: selectedSlot,
        display_name: cleanName,
        avatar_color: avatarColor
      },
      {
        id: otherSlot,
        display_name: showPartnerField && partnerName.trim() ? partnerName.trim() : (existingOther?.display_name || (otherSlot === 'user_2' ? 'Partner 2' : 'Partner 1')),
        avatar_color: existingOther?.avatar_color || (otherSlot === 'user_2' ? 'emerald' : 'amber')
      }
    ];

    onSaveProfiles(updated, selectedSlot);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
      <div className="bg-white border border-outline-variant/40 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 text-on-surface">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-fixed text-primary mb-1 shadow-sm">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              person
            </span>
          </div>
          <h2 className="font-display font-extrabold text-2xl text-on-surface tracking-tight">
            {canDismiss ? 'Your Profile' : 'What is your name?'}
          </h2>
          <p className="font-body text-xs text-on-surface-variant leading-relaxed">
            Enter your name to start voting on tomorrow&apos;s South Indian breakfast.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Household Slot Selector */}
          <div className="space-y-1.5">
            <span className="font-label-md text-[11px] text-on-surface-variant font-bold uppercase tracking-wider block">
              Which profile are you on this device?
            </span>
            <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-1 rounded-xl border border-outline-variant/30">
              <button
                type="button"
                onClick={() => handleSlotChange('user_1')}
                className={`py-2 px-3 rounded-lg font-label-md text-xs font-bold transition-all ${
                  selectedSlot === 'user_1'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Partner 1
              </button>
              <button
                type="button"
                onClick={() => handleSlotChange('user_2')}
                className={`py-2 px-3 rounded-lg font-label-md text-xs font-bold transition-all ${
                  selectedSlot === 'user_2'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Partner 2
              </button>
            </div>
          </div>

          {/* Single Name Input */}
          <div className="space-y-1.5">
            <label className="font-label-md text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
              Your Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Bishwajith"
              autoFocus
              required
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3.5 py-3 text-base font-semibold text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Avatar Color Theme */}
          <div className="space-y-1.5">
            <span className="font-label-md text-[11px] text-on-surface-variant font-bold uppercase tracking-wider block">
              Avatar Theme
            </span>
            <div className="flex items-center gap-2.5 pt-0.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setAvatarColor(c.id)}
                  className={`w-7 h-7 rounded-full ${c.bg} transition-transform ${
                    avatarColor === c.id ? 'ring-3 ring-primary ring-offset-2 scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Optional Partner Name Expander (Hidden by default so fresh start is completely clean) */}
          <div className="pt-1">
            {!showPartnerField ? (
              <button
                type="button"
                onClick={() => setShowPartnerField(true)}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Also enter partner&apos;s name (optional)</span>
              </button>
            ) : (
              <div className="space-y-1.5 animate-slide-down bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                <label className="font-label-md text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                  Partner&apos;s Name
                </label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="e.g. Deepa"
                  className="w-full bg-white border border-outline-variant rounded-xl px-3 py-2 text-sm font-semibold text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            {canDismiss && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-outline-variant text-on-surface-variant font-semibold text-sm hover:bg-surface-container transition-colors min-h-[48px]"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm shadow-md active:scale-95 transition-all min-h-[48px]"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              <span>{canDismiss ? 'Save Changes' : 'Start Voting'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
