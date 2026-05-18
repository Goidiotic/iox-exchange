import { ShoppingCart, Tag } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import TokenLogo from './TokenLogo';
import { formatINR } from '../../utils/format';

export default function TokenCard({ token }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <TokenLogo token={token} />
          <div>
            <h3 className="font-semibold text-white">{token.name}</h3>
            <p className="text-sm text-slate-400">{token.symbol} internal balance</p>
          </div>
        </div>
        <span className="badge border-acid/40 bg-acid/10 text-acid">{formatINR(token.rewardAmount)} Rewards</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="panel p-3">
          <p className="text-xs text-slate-500">Fixed price</p>
          <p className="mt-1 font-semibold">{formatINR(token.price)}</p>
        </div>
        <div className="panel p-3">
          <p className="text-xs text-slate-500">Balance</p>
          <p className="mt-1 font-semibold">{token.balance.toLocaleString('en-IN')}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button><ShoppingCart size={16} />Buy</Button>
        <Button variant="secondary"><Tag size={16} />Sell</Button>
      </div>
    </Card>
  );
}
