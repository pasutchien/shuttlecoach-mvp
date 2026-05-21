/** Credit packages (SPEC §1.5). */
import type { CreditPackage } from '@/src/types';

/** Credits charged per AI analysis. */
export const ANALYSIS_COST = 100;

/** Free credits gifted on completing onboarding (SPEC §1.5). */
export const ONBOARDING_GIFT = 100;

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'single-match',
    credits: 100,
    priceThb: 20,
    bestForKey: 'wallet.bestForCasual',
  },
  {
    id: 'practice-pack',
    credits: 500,
    priceThb: 90,
    savingsPct: 10,
    bestForKey: 'wallet.bestForRegular',
  },
  {
    id: 'pro-pack',
    credits: 1200,
    priceThb: 200,
    savingsPct: 20,
    mostPopular: true,
    bestForKey: 'wallet.bestForDedicated',
  },
];

export function getPackage(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((p) => p.id === id);
}
