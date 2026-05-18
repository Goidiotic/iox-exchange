import { ShieldCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import FormField from '../components/forms/FormField';
import Skeleton from '../components/common/Skeleton';
import { TOKENS } from '../constants/tokens';
import { useMockQuery } from '../hooks/useMockQuery';
import { mockApi } from '../services/mockApi';
import { useTradingStore } from '../stores/tradingStore';
import { formatINR } from '../utils/format';

export default function MarketPage() {
  const { selectedTokenId } = useTradingStore();
  const [sizeFilter, setSizeFilter] = useState('all');
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState('');
  const [purchaseError, setPurchaseError] = useState('');
  const [creatingPurchase, setCreatingPurchase] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data = [], isLoading } = useMockQuery('market', mockApi.market);
  const { data: walletSummary } = useMockQuery('market-wallet-summary', mockApi.walletSummary);
  const token = walletSummary?.tokens?.find((item) => item.id === selectedTokenId || item.symbol?.toLowerCase() === selectedTokenId) || walletSummary?.tokens?.[0] || TOKENS[0];
  const visibleOrders = data
    .filter((order) => order.status === 'pending' && order.token.id === token.id && Number(order.availableQuantity || order.quantity || 0) >= 100)
    .sort((a, b) => {
      if (sizeFilter === 'small') return a.amount - b.amount;
      if (sizeFilter === 'large') return b.amount - a.amount;
      return 0;
    });

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
    if (!quantity || quantity < 100 || quantity > maxQuantity) {
      setPurchaseError('Enter token quantity from 100 up to the available amount.');
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
      <div className="mb-5 space-y-4">
        <div>
          <p className="text-xl font-black uppercase leading-tight text-acid">BUY {token.symbol} USING M3 WALLET</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Market</h1>
        </div>
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
      </div>

      {isLoading ? (
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
                  placeholder="Min 100"
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
