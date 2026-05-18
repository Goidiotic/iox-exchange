import { useState } from 'react';
import { QrCode, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import PageHeader from '../components/common/PageHeader';
import Skeleton from '../components/common/Skeleton';
import { useMockQuery } from '../hooks/useMockQuery';
import { usePreciseCountdown } from '../hooks/usePreciseCountdown';
import { mockApi } from '../services/mockApi';
import { useTradingStore } from '../stores/tradingStore';
import { formatINR } from '../utils/format';

export default function PaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const setOrderStatus = useTradingStore((state) => state.setOrderStatus);
  const [transactionId, setTransactionId] = useState('');
  const { data: order, isLoading } = useMockQuery(['payment-order', orderId], () => mockApi.order(orderId));
  const timerMs = order?.expiresAt ? Math.max(new Date(order.expiresAt).getTime() - Date.now(), 0) : 15 * 60 * 1000;
  const paymentTimer = usePreciseCountdown(timerMs);

  if (isLoading) return <Skeleton rows={2} />;
  if (!order) {
    return (
      <Card hover={false} className="p-5 text-center">
        <h2 className="text-lg font-semibold text-white">Order not found</h2>
        <p className="mt-2 text-sm text-slate-300">This payment order is not available anymore.</p>
        <Button className="mt-4" onClick={() => navigate('/market')}>Back to Market</Button>
      </Card>
    );
  }

  const isPurchaseOrder = order.type === 'buy';
  const maxQuantity = Number(isPurchaseOrder ? order.quantity : order.availableQuantity || order.quantity || 0);
  const selectedQuantity = Number(order.totalQuantity || order.quantity || maxQuantity || 0);
  const calculatedAmount = selectedQuantity * Number(order.token.price || 0);
  const paymentAmount = Number(order.totalAmount || order.amount || calculatedAmount || 0);
  const addressSeed = `${order.id.replace(/[^A-Z0-9]/gi, '')}${paymentAmount}${selectedQuantity}${order.token.symbol}`.toUpperCase();
  const paymentAddress = `M3${addressSeed}9X7K4L2Q8P6N5R3T1V0Y`.slice(0, 34);

  const submitPayment = async () => {
    if (!transactionId.trim()) {
      toast.error('Enter the transaction ID');
      return;
    }
    if (!selectedQuantity || selectedQuantity <= 0 || !paymentAmount || paymentAmount <= 0) {
      toast.error('Payment order amount is not available');
      return;
    }

    const buyOrder = await mockApi.submitPayment(order.id, { transactionId });
    setOrderStatus(buyOrder.id, 'processing', 3 * 60 * 1000);
    toast.success('Payment submitted. Order moved to processing');
    navigate(`/orders/${buyOrder.id}`);
  };

  return (
    <>
      <PageHeader
        title="Payment Verification"
        action={<span className={`font-mono text-sm font-semibold ${paymentTimer.expired ? 'text-red-300' : 'text-warn'}`}>Pay within {paymentTimer.label}</span>}
      />
      <div className="mx-auto w-full max-w-md">
        <Card hover={false} className="p-4 sm:p-5">
          <div className="space-y-4">
            <div className="grid place-items-center rounded-lg border border-dashed border-cyanx/40 bg-cyanx/10 p-4">
              <div className="w-full text-center">
                <div className="mx-auto grid h-44 w-44 max-w-full place-items-center rounded-lg border border-line bg-white p-3 text-ink">
                  <div className="grid h-full w-full grid-cols-5 gap-1" aria-label={paymentAddress}>
                    {Array.from({ length: 25 }).map((_, index) => (
                      <span
                        key={index}
                        className={index % 2 === 0 || [6, 8, 16, 18].includes(index) ? 'rounded-sm bg-ink' : 'rounded-sm bg-slate-200'}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-white">
                  <QrCode size={16} /> Scan to Pay
                </p>
                <p className="mt-2 text-3xl font-semibold leading-tight">{formatINR(paymentAmount)}</p>
                <p className="mt-1 text-xs font-medium text-slate-300">
                  {selectedQuantity.toLocaleString('en-IN')} {order.token.symbol}
                </p>
              </div>
            </div>

            <div className="panel p-4 text-sm text-slate-300">
              <div className="flex justify-between gap-3">
                <span>Payment amount</span>
                <strong className="text-white">{formatINR(paymentAmount)}</strong>
              </div>
            </div>

            <div className="panel p-4 text-sm text-slate-300">
              <p className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck size={16} className="text-acid" />
                Pay the exact INR amount, then enter the transaction ID. Your order will move to processing after submission.
              </p>
              <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-400" htmlFor="transaction-id">
                Transaction ID
              </label>
              <input
                id="transaction-id"
                className="field"
                value={transactionId}
                onChange={(event) => setTransactionId(event.target.value)}
                placeholder="Transaction ID"
              />
              <Button className="mt-4 w-full" onClick={submitPayment}>I have paid</Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
