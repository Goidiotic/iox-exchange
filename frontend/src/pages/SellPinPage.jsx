import { useQueryClient } from '@tanstack/react-query';
import { Delete, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { mockApi } from '../services/mockApi';
import { calculateSellQuote } from '../utils/sellFlow';

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

export default function SellPinPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { state } = useLocation();
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const token = state?.token;
  const amount = Number(state?.amount || 0);
  const sellType = state?.sellType || 'manual';
  const quote = useMemo(() => calculateSellQuote({ amount, token, sellType, quickSellFees: state?.quickSellFees }), [amount, token, sellType, state]);

  if (!token || !amount) {
    navigate('/sell', { replace: true });
    return null;
  }

  const pressKey = (key) => {
    if (!key) return;
    if (key === 'back') {
      setPin((value) => value.slice(0, -1));
      return;
    }
    setPin((value) => (value.length >= 6 ? value : `${value}${key}`));
  };

  const submit = async () => {
    if (pin.length < 4) {
      toast.error('Enter your transaction PIN');
      return;
    }
    setSubmitting(true);
    try {
      await mockApi.createSellOrder({
        tokenId: token.id,
        quantity: amount,
        mode: sellType,
        transactionPin: pin,
      });
      toast.success('Sell order sent for admin verification');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['market'] }),
        queryClient.invalidateQueries({ queryKey: ['market-wallet-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['sell-wallet-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['user-orders'] }),
      ]);
      navigate('/orders', { replace: true });
    } catch (error) {
      if (error.details?.code === 'TRANSACTION_PIN_REQUIRED') {
        toast('Create your Transaction PIN before selling');
        navigate('/transaction-pin', { state: { from: '/sell/pin' } });
        return;
      }
      toast.error(error.message || 'Unable to create sell order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[390px]">
      <Card hover={false} className="p-4">
        <div className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-acid/15 text-acid">
            <ShieldCheck size={24} />
          </div>
          <p className="mt-4 text-sm text-slate-400">Final receivable</p>
          <h2 className="mt-1 text-3xl font-semibold text-white">{quote.finalReceivableLabel}</h2>
          <p className="mt-2 text-sm text-slate-400">{amount.toLocaleString('en-IN')} {token.symbol} via {sellType === 'quick' ? 'Quick Sell' : 'Manual Sell'}</p>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <span key={index} className={`h-3 w-3 rounded-full border border-acid/60 ${pin.length > index ? 'bg-acid' : 'bg-transparent'}`} />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {keys.map((key, index) => (
            <button
              key={`${key}-${index}`}
              type="button"
              disabled={!key}
              onClick={() => pressKey(key)}
              className="grid aspect-square place-items-center rounded-lg border border-line bg-white/[0.045] text-xl font-semibold text-white outline-none disabled:opacity-0"
              aria-label={key === 'back' ? 'Delete digit' : key || 'Blank'}
            >
              {key === 'back' ? <Delete size={22} /> : key}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-2">
          <Button onClick={submit} disabled={submitting || pin.length < 4}>
            {submitting ? 'Verifying...' : `Pay PIN: ${quote.finalReceivableLabel}`}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </Card>
    </div>
  );
}
