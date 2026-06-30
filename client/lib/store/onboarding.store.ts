import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FeeLine, OrgType, Structure } from '@/types/onboarding.types';

export interface OnboardingState {
  step: 1 | 2 | 3 | 4;
  orgId?: string;
  orgName?: string;
  orgType?: OrgType;
  structure?: Structure;
  collectionId?: string;
  collectionName?: string;
  collectionCycle?: string;
  collectionAmount?: number;
  feeLines?: FeeLine[];
  memberCount?: number;
  inviteCode?: string;
}

interface OnboardingStore extends OnboardingState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setOrgId: (orgId: string) => void;
  setStep: (step: 1 | 2 | 3 | 4) => void;
  setOrgDetails: (details: Partial<OnboardingState>) => void;
  setCollectionDetails: (details: Partial<OnboardingState>) => void;
  setMemberCount: (count: number) => void;
  setInviteCode: (code: string) => void;
  reset: () => void;
}

const initialState: OnboardingState = {
  step: 1,
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      ...initialState,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

      setOrgId: (orgId: string) => set({ orgId }),

      setStep: (step: 1 | 2 | 3 | 4) => set({ step }),

      setOrgDetails: (details) =>
        set((state) => ({
          ...state,
          ...details,
          step: 2,
        })),

      setCollectionDetails: (details) =>
        set((state) => ({
          ...state,
          ...details,
          step: 3,
        })),

      setMemberCount: (memberCount: number) => set({ memberCount }),

      setInviteCode: (inviteCode: string) =>
        set((state) => ({
          ...state,
          inviteCode,
          step: 4,
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'onboarding-store',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
