import { CheckCircle2, Timer } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import FormField from '../components/forms/FormField';
import Skeleton from '../components/common/Skeleton';
import { TOKENS } from '../constants/tokens';
import { useMockQuery } from '../hooks/useMockQuery';
import { mockApi } from '../services/mockApi';
import { useTradingStore } from '../stores/tradingStore';
import { formatINR } from '../utils/format';
import { calculateSellQuote, defaultQuickSellFees } from '../utils/sellFlow';

export default function SellPage() {
  const navigate = useNavigate();
  const selectedTokenId = useTradingStore((state) => state.selectedTokenId);
  const [sellType, setSellType] = useState('manual');
  const [sellAmount, setSellAmount] = useState('');
  const [error, setError] = useState('');
  const { data: walletSummary, isLoading: walletLoading } = useMockQuery('sell-wallet-summary', mockApi.walletSummary);
  const { data: platformSettings } = useMockQuery('platform-settings', mockApi.platformSettings);
  const token = walletSummary?.tokens?.find((item) => item.id === selectedTokenId || item.symbol?.toLowerCase() === selectedTokenId) || walletSummary?.tokens?.[0] || TOKENS[0];
  const amount = Number(sellAmount || 0);
  const quickSellFees = platformSettings?.quickSellFees || defaultQuickSellFees;
  const quote = calculateSellQuote({ amount, token, sellType, quickSellFees });
  const canSell = amount >= 100 && amount <= 50000 && amount <= Number(token.balance || 0);

  const proceed = () => {
    setError('');
    if (!canSell) {
      setError('Enter a coin amount between 100 and 50000 within your available balance.');
      return;
    }
    navigate('/sell/confirm', {
      state: {
        token,
        amount,
        sellType,
        quickSellFees,
      },
    });
  };

  if (walletLoading) return <Skeleton rows={3} />;

  return (
    <Card hover={false} className="mx-auto max-w-2xl p-5">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-white">Sell {token.name}</h2>
        <p className="mt-1 text-sm text-slate-400">Available {Number(token.balance || 0).toLocaleString('en-IN')} {token.symbol}</p>
      </div>

      <div className="space-y-4">
        <FormField label="Coin amount">
          <input className="field" inputMode="decimal" value={sellAmount} onChange={(event) => setSellAmount(event.target.value)} placeholder={`Min 100, max 50000 ${token.symbol}`} />
        </FormField>

        <div className="grid gap-3 sm:grid-cols-2">
          <button onClick={() => setSellType('manual')} className={`panel p-4 text-left ${sellType === 'manual' ? 'border-acid' : ''}`}>
            <CheckCircle2 className="text-acid" />
            <p className="mt-3 font-semibold">Manual</p>
            <p className="mt-1 text-sm text-slate-400">Marketplace sell with admin verification and rewards.</p>
          </button>
          <button onClick={() => setSellType('quick')} className={`panel p-4 text-left ${sellType === 'quick' ? 'border-cyanx' : ''}`}>
            <Timer className="text-cyanx" />
            <p className="mt-3 font-semibold">Quick Sell</p>
            <p className="mt-1 text-sm text-slate-400">No rewards, with admin-managed fees.</p>
          </button>
        </div>

        {amount > 0 && (
          <div className="panel grid gap-2 p-3 text-sm text-slate-300">
            <div className="flex justify-between"><span>Coin price</span><strong className="text-white">{formatINR(token.price)}</strong></div>
            <div className="flex justify-between"><span>Gross value</span><strong className="text-white">{formatINR(quote.grossAmount)}</strong></div>
            {quote.feeRows.map((fee) => (
              <div className="flex justify-between" key={fee.label}>
                <span>{fee.label} ({fee.percentage}%)</span>
                <strong className="text-warn">-{formatINR(fee.amount)}</strong>
              </div>
            ))}
          </div>
        )}

        {error && <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}
        <Button className="w-full" onClick={proceed}>
          Proceed: {quote.finalReceivableLabel}
        </Button>
      </div>
    </Card>
  );
}
