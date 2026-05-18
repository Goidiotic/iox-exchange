import { ArrowDownLeft, ArrowUpRight, BadgeIndianRupee, Gift, ReceiptText } from 'lucide-react';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import PageHeader from '../components/common/PageHeader';
import Skeleton from '../components/common/Skeleton';
import { useMockQuery } from '../hooks/useMockQuery';
import { mockApi } from '../services/mockApi';

const titleFor = (type = '') => {
  const normalized = String(type).toLowerCase();
  if (normalized.includes('buy')) return 'BUY';
  if (normalized.includes('sell')) return 'SELL';
  if (normalized.includes('reward')) return 'REWARDS';
  if (normalized.includes('referral') || normalized.includes('commission')) return 'COMMISSION';
  if (normalized.includes('fee')) return 'FEES';
  if (normalized.includes('coupon')) return 'REWARDS';
  if (normalized.includes('refund')) return 'SELL';
  return normalized ? normalized.toUpperCase() : 'TRANSACTION';
};

const iconFor = (type = '') => {
  const normalized = String(type).toLowerCase();
  if (normalized.includes('buy')) return ArrowDownLeft;
  if (normalized.includes('sell') || normalized.includes('refund')) return ArrowUpRight;
  if (normalized.includes('reward') || normalized.includes('coupon')) return Gift;
  if (normalized.includes('referral') || normalized.includes('commission')) return BadgeIndianRupee;
  return ReceiptText;
};

const subtitleFor = (row) => row.subtitle || `${row.type || 'transaction'} ${row.token || ''}`.trim();

function TransactionCard({ row }) {
  const Icon = iconFor(row.type);
  return (
    <article className="flex items-center gap-3 rounded-lg border border-line bg-white/[0.045] p-3">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-cyanx/15 text-cyanx">
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-sm font-semibold text-white">{titleFor(row.type)}</h2>
          <span className="shrink-0 text-[11px] text-slate-500">{row.date}{row.time ? `, ${row.time}` : ''}</span>
        </div>
        <p className="mt-1 truncate text-xs text-slate-400">{subtitleFor(row)}</p>
        <p className="mt-0.5 truncate font-mono text-[11px] text-slate-600">{row.id}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-white">{row.amount}</p>
        <Badge status={row.status} className="mt-1 px-2 py-0.5 text-[10px] capitalize">{row.status}</Badge>
      </div>
    </article>
  );
}

export default function HistoryPage() {
  const { data = [], isLoading } = useMockQuery('history', mockApi.history);
  if (isLoading) return <Skeleton rows={4} />;
  return (
    <>
      <PageHeader title="Transaction History" eyebrow="Buy, sell, rewards, commission and fees" />
      {data.length === 0 ? (
        <EmptyState title="No transactions found" body="Your transaction activity will appear here." />
      ) : (
        <div className="space-y-3">
          {data.map((row) => <TransactionCard key={row.id} row={row} />)}
        </div>
      )}
    </>
  );
}
