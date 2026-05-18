import { CheckCircle2, ShieldCheck, Timer, WalletCards } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import FormField from '../components/forms/FormField';
import Skeleton from '../components/common/Skeleton';
import { TOKENS } from '../constants/tokens';
import { useMockQuery } from '../hooks/useMockQuery';
import { mockApi } from '../services/mockApi';
import { useTradingStore } from '../stores/tradingStore';
import { formatINR } from '../utils/format';

export default function MarketPage() {
  const { orderMode, setOrderMode, selectedTokenId } = useTradingStore();
  const [sellType, setSellType] = useState('manual');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [sellAmount, setSellAmount] = useState('');
  const [sellStep, setSellStep] = useState('entry');
  const [transactionPin, setTransactionPin] = useState('');
  const [sellError, setSellError] = useState('');
  const [creatingSell, setCreatingSell] = useState(false);
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState('');
  const [purchaseError, setPurchaseError] = useState('');
  const [creatingPurchase, setCreatingPurchase] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data = [], isLoading } = useMockQuery('market', mockApi.market);
  const { data: walletSummary, isLoading: walletLoading } = useMockQuery('market-wallet-summary', mockApi.walletSummary);
  const { data: platformSettings } = useMockQuery('platform-settings', mockApi.platformSettings);
  const token = walletSummary?.tokens?.find((item) => item.id === selectedTokenId || item.symbol?.toLowerCase() === selectedTokenId) || walletSummary?.tokens?.[0] || TOKENS[0];
  const amount = Number(sellAmount || 0);
  const inrTotal = amount * (token.price || 0);
  const quickSellFees = platformSettings?.quickSellFees || {
    processingFeePercentage: 0.5,
    burnPercentage: 1,
    paymentGatewayPercentage: 2,
  };
  const quickFeeRows = [
    ['Processing Fees', quickSellFees.processingFeePercentage],
    ['Quick Sell Burn', quickSellFees.burnPercentage],
    ['Payment Gateway Charge', quickSellFees.paymentGatewayPercentage],
  ].map(([label, percentage]) => ({
    label,
    percentage: Number(percentage || 0),
    amount: (inrTotal * Number(percentage || 0)) / 100,
  }));
  const quickFeeTotal = quickFeeRows.reduce((sum, fee) => sum + fee.amount, 0);
  const netReceiveValue = sellType === 'quick' ? inrTotal - quickFeeTotal : inrTotal;
  const canSell = amount > 0 && amount <= (token.balance || 0);
  const visibleOrders = data
    .filter((order) => ['awaiting payment', 'pending', 'verified pending'].includes(order.status) && order.token.id === token.id)
    .sort((a, b) => {
      if (sizeFilter === 'small') return a.amount - b.amount;
      if (sizeFilter === 'large') return b.amount - a.amount;
      return 0;
    });

  const resetSellFlow = () => {
    setSellStep('entry');
    setTransactionPin('');
    setSellError('');
  };

  const startSell = async () => {
    setSellError('');
    if (!canSell) {
      setSellError('Enter a token amount within your available balance.');
      return;
    }
    try {
      const status = await mockApi.transactionPinStatus();
      if (!status.hasTransactionPin) {
        toast('Create your Transaction PIN before selling');
        navigate('/transaction-pin', { state: { from: '/market' } });
        return;
      }
      setSellStep('confirm');
    } catch (error) {
      setSellError(error.message || 'Unable to check Transaction PIN status');
    }
  };

  const createSellOrder = async () => {
    setSellError('');
    if (!transactionPin.trim()) {
      setSellError('Enter your transaction PIN to continue.');
      return;
    }
    setCreatingSell(true);
    try {
      await mockApi.createSellOrder({
        tokenId: token.id,
        quantity: amount,
        mode: sellType,
        transactionPin,
      });
      toast.success('Sell order sent for admin verification');
      setSellAmount('');
      resetSellFlow();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['market'] }),
        queryClient.invalidateQueries({ queryKey: ['market-wallet-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['user-orders'] }),
      ]);
    } catch (error) {
      if (error.details?.code === 'TRANSACTION_PIN_REQUIRED') {
        toast('Create your Transaction PIN before selling');
        navigate('/transaction-pin', { state: { from: '/market' } });
        return;
      }
      setSellError(error.message || 'Unable to create sell order');
    } finally {
      setCreatingSell(false);
    }
  };

  const openPurchaseWindow = (order) => {
    setPurchaseOrder(order);
    setPurchaseQuantity(String(order.availableQuantity || order.quantity || ''));
    setPurchaseError('');
  };

  const closePurchaseWindow = () => {
    setPurchaseOrder(null);
    setPurchaseQuantity('');
    setPurchaseError('');
  };

  const createPurchaseOrder = async () => {
    if (!purchaseOrder) return;
    const quantity = Number(purchaseQuantity || 0);
    const maxQuantity = Number(purchaseOrder.availableQuantity || purchaseOrder.quantity || 0);
    setPurchaseError('');
    if (!quantity || quantity <= 0 || quantity > maxQuantity) {
      setPurchaseError('Enter token quantity within available amount.');
      return;
    }
    setCreatingPurchase(true);
    try {
      const buyOrder = await mockApi.createPurchaseOrder(purchaseOrder.id, { quantity });
      toast.success('Purchase order created');
      closePurchaseWindow();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['market'] }),
        queryClient.invalidateQueries({ queryKey: ['user-orders'] }),
      ]);
      navigate(`/orders/${buyOrder.id}`);
    } catch (error) {
      setPurchaseError(error.message || 'Unable to create purchase order');
    } finally {
      setCreatingPurchase(false);
    }
  };

  return (
    <div className="overflow-x-hidden">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-grid grid-cols-2 rounded-lg border border-line bg-white/[0.04] p-1">
          {['buy', 'sell'].map((mode) => (
            <button
              key={mode}
              onClick={() => setOrderMode(mode)}
              className={`rounded-md px-5 py-2 text-sm font-semibold capitalize ${orderMode === mode ? 'bg-acid text-ink' : 'text-slate-300'}`}
            >
              {mode}
            </button>
          ))}
        </div>
        {orderMode === 'buy' && (
          <div className="flex w-fit items-center justify-start gap-2">
            {['all', 'small', 'large'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSizeFilter(filter)}
                className={`h-8 rounded-full border px-3 text-xs font-semibold capitalize transition ${sizeFilter === filter ? 'border-cyanx bg-cyanx text-ink' : 'border-line bg-white/[0.04] text-slate-300'}`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}
      </div>

      {orderMode === 'buy' ? (
        isLoading ? (
          <Skeleton rows={3} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-white/[0.045]">
            {visibleOrders.map((order) => (
              <div key={order.id} className="flex items-start justify-between gap-3 border-b border-line px-3 py-4 last:border-b-0 sm:px-4">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-acid to-cyanx text-sm font-black text-ink">
                    {order.seller.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-white sm:text-base">{order.seller}</h3>
                      <ShieldCheck size={14} className="shrink-0 text-acid" />
                      <Badge status="pending" className="px-2 py-0.5 text-[10px]">Online</Badge>
                    </div>
                    <p className="mt-1 truncate text-[11px] text-slate-500">Order value {formatINR(order.amount)}</p>
                    <p className="mt-1 truncate text-xs text-acid">{formatINR(order.rewardAmount)} Rewards</p>
                  </div>
                </div>

                <div className="w-24 shrink-0 self-start text-right sm:w-32">
                  <p className="truncate text-sm font-semibold text-white sm:text-base">{order.quantity.toLocaleString('en-IN')} {order.token.symbol}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatINR(order.amount)}</p>
                  <button type="button" onClick={() => openPurchaseWindow(order)} className="btn-primary mt-2 px-3 py-2 text-xs sm:px-4">Buy</button>
                </div>
              </div>
            ))}
            {visibleOrders.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-500">No verified sell orders available for this token.</div>
            )}
          </div>
        )
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <Card hover={false}>
            <h2 className="font-semibold">Sell {token.name}</h2>
            <div className="mt-4 space-y-4">
              <div className="panel flex items-center justify-between p-3">
                <span className="text-sm text-slate-400">Available balance</span>
                <span className="font-semibold">
                  {walletLoading ? 'Loading...' : `${Number(token.balance || 0).toLocaleString('en-IN')} ${token.symbol}`}
                </span>
              </div>
              <FormField label="Token amount">
                <input
                  className="field"
                  inputMode="decimal"
                  placeholder="Token amount"
                  value={sellAmount}
                  onChange={(event) => {
                    setSellAmount(event.target.value);
                    resetSellFlow();
                  }}
                />
              </FormField>
              {amount > 0 && (
                <div className="panel grid gap-2 p-3 text-sm text-slate-300">
                  <div className="flex justify-between"><span>Token price</span><strong className="text-white">{formatINR(token.price)}</strong></div>
                  <div className="flex justify-between"><span>Gross value</span><strong className="text-white">{formatINR(inrTotal)}</strong></div>
                  {sellType === 'quick' && quickFeeRows.map((fee) => (
                    <div className="flex justify-between" key={fee.label}>
                      <span>{fee.label} ({fee.percentage}%)</span>
                      <strong className="text-warn">-{formatINR(fee.amount)}</strong>
                    </div>
                  ))}
                  <div className="flex justify-between"><span>Total receive value</span><strong className="text-acid">{formatINR(netReceiveValue)}</strong></div>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <button onClick={() => setSellType('manual')} className={`panel p-4 text-left ${sellType === 'manual' ? 'border-acid' : ''}`}>
                  <CheckCircle2 className="text-acid" />
                  <p className="mt-3 font-semibold">Manual</p>
                  <p className="mt-1 text-sm text-slate-400">Sell through the marketplace with admin verification and rewards.</p>
                </button>
                <button onClick={() => setSellType('quick')} className={`panel p-4 text-left ${sellType === 'quick' ? 'border-cyanx' : ''}`}>
                  <Timer className="text-cyanx" />
                  <p className="mt-3 font-semibold">Quick Sell</p>
                  <p className="mt-1 text-sm text-slate-400">Instant-style sell with no rewards and admin-managed fees.</p>
                </button>
              </div>
              {sellStep === 'confirm' && (
                <div className="panel space-y-3 border-acid/60 p-4">
                  <div>
                    <h3 className="font-semibold text-white">Sell Confirmation</h3>
                    <p className="mt-1 text-sm text-slate-400">Review the details before transaction PIN verification.</p>
                  </div>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">Amount</span><strong>{amount.toLocaleString('en-IN')} {token.symbol}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-400">Mode</span><strong className="capitalize">{sellType}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-400">Gross INR value</span><strong>{formatINR(inrTotal)}</strong></div>
                    {sellType === 'quick' && (
                      <>
                        <div className="flex justify-between"><span className="text-slate-400">Total fees</span><strong className="text-warn">-{formatINR(quickFeeTotal)}</strong></div>
                        <div className="flex justify-between"><span className="text-slate-400">Net receive value</span><strong className="text-acid">{formatINR(netReceiveValue)}</strong></div>
                      </>
                    )}
                    <div className="flex justify-between"><span className="text-slate-400">Balance after sell</span><strong>{Number((token.balance || 0) - amount).toLocaleString('en-IN')} {token.symbol}</strong></div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button type="button" variant="ghost" onClick={resetSellFlow}>Edit</Button>
                    <Button type="button" onClick={() => setSellStep('pin')}>Confirm Sell</Button>
                  </div>
                </div>
              )}
              {sellStep === 'pin' && (
                <div className="panel space-y-3 border-cyanx/60 p-4">
                  <FormField label="Transaction PIN">
                    <input
                      className="field"
                      inputMode="numeric"
                      type="password"
                      placeholder="Enter transaction PIN"
                      value={transactionPin}
                      onChange={(event) => setTransactionPin(event.target.value)}
                    />
                  </FormField>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button type="button" variant="ghost" onClick={() => setSellStep('confirm')}>Back</Button>
                    <Button type="button" onClick={createSellOrder} disabled={creatingSell}>
                      {creatingSell ? 'Verifying...' : 'Verify & Create Sell'}
                    </Button>
                  </div>
                </div>
              )}
              {sellError && <div className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{sellError}</div>}
              {sellStep === 'entry' && (
                <Button className="w-full" onClick={startSell} disabled={walletLoading}>
                  <WalletCards size={16} />Start Sell
                </Button>
              )}
            </div>
          </Card>
          <Card hover={false}>
            <h2 className="font-semibold">Sell rules</h2>
            <div className="mt-4 grid gap-3">
              {['Token prices are managed from the admin panel.', 'Manual verification-stage orders remain hidden from buyers.', 'Quick Sell has no rewards and applies processing, burn and payment gateway fees.', 'INR settlement is handled through M3 Wallet APIs.'].map((item) => (
                <p className="panel p-3 text-sm text-slate-300" key={item}>{item}</p>
              ))}
            </div>
          </Card>
        </div>
      )}

      {purchaseOrder && (
        <div className="fixed inset-0 z-[70] grid place-items-end bg-black/70 p-4 backdrop-blur-sm sm:place-items-center">
          <div className="w-full max-w-md rounded-lg border border-line bg-panel p-4 shadow-2xl">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white">Purchase {purchaseOrder.token.symbol}</h2>
              <p className="mt-1 text-sm text-slate-400">Create a buy order from this verified seller listing.</p>
            </div>
            <div className="space-y-4">
              <div className="panel grid gap-2 p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Seller UID</span>
                  <strong className="text-white">{purchaseOrder.seller}</strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Available</span>
                  <strong className="text-white">{Number(purchaseOrder.availableQuantity || purchaseOrder.quantity).toLocaleString('en-IN')} {purchaseOrder.token.symbol}</strong>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Price</span>
                  <strong className="text-white">{formatINR(purchaseOrder.token.price)}</strong>
                </div>
              </div>
              <FormField label="Token quantity to buy">
                <input
                  className="field"
                  inputMode="decimal"
                  value={purchaseQuantity}
                  onChange={(event) => setPurchaseQuantity(event.target.value)}
                  placeholder="Token quantity"
                />
              </FormField>
              <div className="panel flex justify-between gap-3 p-3 text-sm">
                <span className="text-slate-400">Payment value</span>
                <strong className="text-acid">{formatINR(Number(purchaseQuantity || 0) * purchaseOrder.token.price)}</strong>
              </div>
              {purchaseError && <div className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{purchaseError}</div>}
              <div className="grid gap-2 sm:grid-cols-2">
                <Button type="button" variant="ghost" onClick={closePurchaseWindow}>Cancel</Button>
                <Button type="button" onClick={createPurchaseOrder} disabled={creatingPurchase}>
                  {creatingPurchase ? 'Creating...' : 'Create Buy Order'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
