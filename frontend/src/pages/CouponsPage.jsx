import { useQueryClient } from '@tanstack/react-query';
import { Clock, Gift, TicketCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import PageHeader from '../components/common/PageHeader';
import Skeleton from '../components/common/Skeleton';
import { useMockQuery } from '../hooks/useMockQuery';
import { mockApi } from '../services/mockApi';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');

const statusFor = (coupon) => {
  if (coupon.redeemed) return 'redeemed';
  if (!coupon.active || new Date(coupon.expiresAt) < new Date()) return 'expired';
  if (Number(coupon.usedCount || 0) >= Number(coupon.usageLimit || 1)) return 'unavailable';
  return 'active';
};

const statusLabelFor = (status) => {
  if (status === 'unavailable') return 'fully used';
  return status;
};

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useMockQuery('coupons', mockApi.coupons);

  const redeem = async (coupon) => {
    try {
      await mockApi.redeemCoupon(coupon._id || coupon.id || coupon.code);
      toast.success('Coupon redeemed');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['coupons'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['history'] }),
        queryClient.invalidateQueries({ queryKey: ['account-wallet-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['market-wallet-summary'] }),
      ]);
    } catch (error) {
      toast.error(error.message || 'Unable to redeem coupon');
    }
  };

  if (isLoading) return <Skeleton rows={3} />;

  return (
    <>
      <PageHeader title="Coupons" eyebrow="Available and redeemed offers" />

      {data.length === 0 ? (
        <EmptyState title="No coupons available" body="Global or individually issued coupons will appear here." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {data.map((coupon) => {
            const status = statusFor(coupon);
            const canRedeem = status === 'active';

            return (
              <Card key={coupon._id || coupon.code} hover={false} className="flex min-h-64 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-acid text-ink">
                    {coupon.redeemed ? <TicketCheck size={21} /> : <Gift size={21} />}
                  </div>
                  <Badge status={status}>{statusLabelFor(status)}</Badge>
                </div>

                <h2 className="mt-5 text-xl font-semibold text-white">{coupon.code}</h2>
                <p className="mt-1 text-sm text-slate-300">{coupon.title}</p>
                {coupon.description && <p className="mt-2 text-sm text-slate-500">{coupon.description}</p>}

                <div className="mt-4 grid gap-2 text-sm text-slate-400">
                  <p>Type: <span className="capitalize text-slate-200">{coupon.scope === 'user_specific' ? 'Individual' : 'Global'}</span></p>
                  <p>Token amount: <span className="text-slate-200">{coupon.value || 0} {coupon.token?.symbol || 'COIN'}</span></p>
                  <p>Usage: <span className="text-slate-200">{coupon.usedCount || 0}/{coupon.usageLimit || 1}</span></p>
                  <p className="flex items-center gap-2"><Clock size={15} />Valid till {formatDate(coupon.expiresAt)}</p>
                </div>

                {canRedeem && (
                  <Button className="mt-auto w-full" onClick={() => redeem(coupon)}>
                    Redeem to Wallet
                  </Button>
                )}
                {!canRedeem && (
                  <div className="mt-auto rounded-lg border border-line bg-white/[0.035] px-4 py-3 text-center text-sm font-medium text-slate-300">
                    {status === 'redeemed' ? 'Redeemed' : 'Not available'}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
