import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { formatINR } from '../utils/format';
import { calculateSellQuote } from '../utils/sellFlow';

export default function SellConfirmPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const token = state?.token;
  const amount = Number(state?.amount || 0);
  const sellType = state?.sellType || 'manual';
  const quickSellFees = state?.quickSellFees;
  const quote = useMemo(() => calculateSellQuote({ amount, token, sellType, quickSellFees }), [amount, token, sellType, quickSellFees]);

  if (!token || !amount) {
    navigate('/sell', { replace: true });
    return null;
  }

  return (
    <Card hover={false} className="mx-auto max-w-2xl p-5">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-white">Sell Confirmation</h2>
        <p className="mt-1 text-sm text-slate-400">Review the final amount before PIN verification.</p>
      </div>

      <div className="space-y-3">
        <div className="panel grid gap-3 p-4 text-sm">
          <div className="flex justify-between"><span className="text-slate-400">Amount</span><strong>{amount.toLocaleString('en-IN')} {token.symbol}</strong></div>
          <div className="flex justify-between"><span className="text-slate-400">Mode</span><strong>{sellType === 'quick' ? 'Quick Sell' : 'Manual'}</strong></div>
          <div className="flex justify-between"><span className="text-slate-400">Coin price</span><strong>{formatINR(token.price)}</strong></div>
          <div className="flex justify-between"><span className="text-slate-400">Gross INR value</span><strong>{formatINR(quote.grossAmount)}</strong></div>
          {quote.feeRows.map((fee) => (
            <div className="flex justify-between" key={fee.label}>
              <span className="text-slate-400">{fee.label} ({fee.percentage}%)</span>
              <strong className="text-warn">-{formatINR(fee.amount)}</strong>
            </div>
          ))}
          <div className="flex justify-between border-t border-line pt-3"><span className="text-slate-400">Final receivable</span><strong className="text-acid">{quote.finalReceivableLabel}</strong></div>
          <div className="flex justify-between"><span className="text-slate-400">Balance after sell</span><strong>{Number((token.balance || 0) - amount).toLocaleString('en-IN')} {token.symbol}</strong></div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="button" onClick={() => navigate('/sell/pin', { state })}>
            Continue: {quote.finalReceivableLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
}
