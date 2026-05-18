export const TOKENS = [
  {
    id: 'coin',
    name: 'Default Coin',
    symbol: 'COIN',
    price: 1,
    balance: 0,
    rewardAmount: 15,
    logo: 'CO',
    color: 'from-acid to-cyanx',
  },
];

export const STATUS_COLORS = {
  pending: 'border-warn/40 bg-warn/10 text-warn',
  processing: 'border-cyanx/40 bg-cyanx/10 text-cyanx',
  awaiting: 'border-blue-400/40 bg-blue-400/10 text-blue-300',
  review: 'border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300',
  verified: 'border-acid/40 bg-acid/10 text-acid',
  redeemed: 'border-acid/40 bg-acid/10 text-acid',
  completed: 'border-cyanx/40 bg-cyanx/10 text-cyanx',
  cancelled: 'border-slate-500/40 bg-slate-500/10 text-slate-300',
  failed: 'border-red-400/40 bg-red-400/10 text-red-300',
  expired: 'border-slate-500/40 bg-slate-500/10 text-slate-300',
};
