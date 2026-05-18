import { create } from 'zustand';

export const useTradingStore = create((set) => ({
  selectedTokenId: 'coin',
  orderMode: 'buy',
  autoSellEnabled: false,
  orderStatusOverrides: {},
  orderTimerOverrides: {},
  setSelectedTokenId: (selectedTokenId) => set({ selectedTokenId }),
  setOrderMode: (orderMode) => set({ orderMode }),
  setAutoSellEnabled: (autoSellEnabled) => set({ autoSellEnabled }),
  setOrderStatus: (orderId, status, timerMs) =>
    set((state) => ({
      orderStatusOverrides: {
        ...state.orderStatusOverrides,
        [orderId]: status,
      },
      orderTimerOverrides: timerMs
        ? {
            ...state.orderTimerOverrides,
            [orderId]: timerMs,
          }
        : state.orderTimerOverrides,
    })),
}));
