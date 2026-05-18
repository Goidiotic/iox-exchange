import { useState } from 'react';
import { Copy, QrCode, ShieldCheck, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import FormField from '../components/forms/FormField';
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
  const [buyQuantity, setBuyQuantity] = useState('');
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
  const selectedQuantity = isPurchaseOrder ? Number(order.quantity || 0) : Number(buyQuantity || maxQuantity);
  const paymentAmount = selectedQuantity * (order.token.price || 0);
  const addressSeed = `${order.id.replace(/[^A-Z0-9]/gi, '')}${paymentAmount}${selectedQuantity}${order.token.symbol}`.toUpperCase();
  const paymentAddress = `M3${addressSeed}9X7K4L2Q8P6N5R3T1V0Y`.slice(0, 34);
  const copyPaymentAddress = () => {
    navigator.clipboard?.writeText(paymentAddress);
    toast.success('Payment address copied');
  };

  const submitPayment = async () => {
    if (!transactionId.trim()) {
      toast.error('Enter the transaction ID');
      return;
    }
    if (!selectedQuantity || selectedQuantity <= 0 || selectedQuantity > maxQuantity) {
      toast.error('Enter token quantity within available amount');
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
        eyebrow="Payment settlement"
        action={<span className={`font-mono text-sm font-semibold ${paymentTimer.expired ? 'text-red-300' : 'text-warn'}`}>Pay within {paymentTimer.label}</span>}
      />
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card hover={false} className="p-5">
          <div className="grid gap-4">
            <div className="grid aspect-square place-items-center rounded-lg border border-dashed border-cyanx/40 bg-cyanx/10 p-5">
              <div className="text-center">
                <div className="mx-auto grid h-40 w-40 place-items-center rounded-lg border border-line bg-white p-3 text-ink">
                  <div className="grid h-full w-full grid-cols-5 gap-1">
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
                <p className="mt-2 text-2xl font-semibold">{formatINR(paymentAmount)}</p>
              </div>
            </div>

            <div className="rounded-lg border border-line bg-white/[0.04] p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                <Wallet size={16} className="text-acid" />
                Receiving address
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <p className="min-w-0 flex-1 break-all rounded-lg bg-black/30 px-3 py-2 font-mono text-sm text-slate-200">{paymentAddress}</p>
                <Button type="button" variant="secondary" onClick={copyPaymentAddress} className="shrink-0">
                  <Copy size={16} /> Copy
                </Button>
              </div>
            </div>
          </div>
        </Card>
        <Card hover={false}>
          <div className="space-y-4">
            <FormField label={`Token quantity to buy (available ${maxQuantity.toLocaleString('en-IN')} ${order.token.symbol})`}>
              <input
                className="field"
                inputMode="decimal"
                value={isPurchaseOrder ? order.quantity : buyQuantity}
                onChange={(event) => setBuyQuantity(event.target.value)}
                placeholder={`${maxQuantity} ${order.token.symbol}`}
                readOnly={isPurchaseOrder}
              />
            </FormField>
            <div className="panel p-4 text-sm text-slate-300">
              <div className="flex justify-between gap-3">
                <span>Payment amount</span>
                <strong className="text-white">{formatINR(paymentAmount)}</strong>
              </div>
            </div>
            <FormField label="Transaction ID">
              <input
                className="field"
                value={transactionId}
                onChange={(event) => setTransactionId(event.target.value)}
                placeholder="Transaction ID"
              />
            </FormField>
            <div className="panel p-4 text-sm text-slate-300">
              <p className="flex items-center gap-2 font-semibold text-white">
                <ShieldCheck size={16} className="text-acid" />
                Payment verification
              </p>
              <p className="mt-2">Pay the exact INR amount to the receiving address, then enter the transaction ID. Your order will move to processing after submission.</p>
            </div>
            <Button className="w-full" onClick={submitPayment}>I have paid</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
