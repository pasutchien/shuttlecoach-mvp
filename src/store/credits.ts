/**
 * Credit store — a UI cache over the service layer's balance + ledger.
 * Mutations go through `api`; the store mirrors the authoritative result.
 */
import { create } from 'zustand';
import type { Transaction } from '@/src/types';
import { api, type PurchaseResult, type RefundResult } from '@/src/services';

interface CreditState {
  balance: number;
  transactions: Transaction[];
  loading: boolean;
  /** True once the balance + ledger have been loaded at least once. */
  hydrated: boolean;
  /** Load balance + ledger from the backend. */
  hydrate: () => Promise<void>;
  /** Refresh just the balance (e.g. after submitting an analysis). */
  refreshBalance: () => Promise<void>;
  /** Buy a credit package. */
  purchase: (packageId: string) => Promise<PurchaseResult>;
  /** Refund a failed/cancelled analysis job (SPEC §6.3). */
  refund: (jobId: string, reason: string) => Promise<RefundResult>;
  /** Clear local cache (sign out). */
  reset: () => void;
}

export const useCreditStore = create<CreditState>((set) => ({
  balance: 0,
  transactions: [],
  loading: false,
  hydrated: false,

  hydrate: async () => {
    set({ loading: true });
    const [{ credits }, transactions] = await Promise.all([
      api.getCreditBalance(),
      api.getTransactions(),
    ]);
    set({ balance: credits, transactions, loading: false, hydrated: true });
  },

  refreshBalance: async () => {
    const { credits } = await api.getCreditBalance();
    set({ balance: credits });
  },

  purchase: async (packageId) => {
    const result = await api.purchaseCredits(packageId);
    set((s) => ({
      balance: result.balance,
      transactions: [result.transaction, ...s.transactions],
    }));
    return result;
  },

  refund: async (jobId, reason) => {
    const result = await api.refundCredits(jobId, reason);
    set((s) => ({
      balance: result.balance,
      transactions: [result.transaction, ...s.transactions],
    }));
    return result;
  },

  reset: () =>
    set({ balance: 0, transactions: [], loading: false, hydrated: false }),
}));
