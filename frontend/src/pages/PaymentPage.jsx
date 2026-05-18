import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import FormField from '../components/forms/FormField';
import PageHeader from '../components/common/PageHeader';
import Skeleton from '../components/common/Skeleton';
import { useMockQuery } from '../hooks/useMockQuery';
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
  if (isLoading) return <Skeleton rows={2} />;

  const isPurchaseOrder = order.type === 'buy';
  const maxQuantity = Number(isPurchaseOrder ? order.quantity : order.availableQuantity || order.quantity || 0);
  const selectedQuantity = isPurchaseOrder ? Number(order.quantity || 0) : Number(buyQuantity || maxQuantity);
  const paymentAmount = selectedQuantity * (order.token.price || 0);
  const submitPayment = async () => {
    if (!transactionId.trim()) {
      toast.error('Enter payment reference details');
      return;
    }
    if (!selectedQuantity || selectedQuantity <= 0 || selectedQuantity > maxQuantity) {
      toast.error('Enter token quantity within available amount');
      return;
    }

    const buyOrder = await mockApi.submitPayment(order.id, { transactionId });
    setOrderStatus(buyOrder.id, 'under review', 3 * 60 * 1000);
    toast.success('Payment details submitted for admin approval');
    navigate(`/orders/${buyOrder.id}`);
  };

  return (
    <>
      <PageHeader
        title="Payment Verification"
        eyebrow="Manual approval"
        action={<span className="text-sm font-semibold text-warn">Admin review required</span>}
      />
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card hover={false} className="p-5">
          <div className="grid min-h-80 place-items-center rounded-lg border border-dashed border-cyanx/40 bg-cyanx/10 p-5 text-center">
            <div>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-acid/15 text-acid">
                <ShieldCheck size={30} />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase text-acid">Test payment mode</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">{formatINR(paymentAmount)}</h2>
              <p className="mt-3 max-w-sm text-sm text-slate-300">Enter buyer payment reference details below. Admin approval will complete the buyer order and the matched seller order.</p>
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
            <FormField label="Payment reference details">
              <input
                className="field"
                value={transactionId}
                onChange={(event) => setTransactionId(event.target.value)}
                placeholder="UTR, bank reference, note, or test reference"
              />
            </FormField>
            <div className="panel p-4 text-sm text-slate-300">
              <p className="flex items-center gap-2 font-semibold text-white">
                <ShieldCheck size={16} className="text-acid" />
                Admin payment approval
              </p>
              <p className="mt-2">After submission, this buy order appears in the admin panel. When admin approves it, coins are credited to the buyer and the matched seller order is completed.</p>
            </div>
            <Button className="w-full" onClick={submitPayment}>Submit for Approval</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
