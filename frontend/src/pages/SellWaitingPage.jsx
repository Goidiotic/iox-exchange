import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import Countdown from '../components/common/Countdown';
import PageHeader from '../components/common/PageHeader';

export default function SellWaitingPage() {
  return (
    <>
      <PageHeader title="Sell Waiting Room" eyebrow="Order matching" action={<Countdown seconds={3600} label="Auto window" />} />
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ['Sell status', 'Awaiting verified buyer', 'pending'],
          ['Transaction status', 'Tokens reserved in platform ledger', 'verified'],
          ['Settlement mode', 'M3 Wallet INR transfer after approval', 'completed'],
        ].map(([title, body, status]) => <Card key={title}><Badge status={status}>{status}</Badge><h2 className="mt-4 font-semibold">{title}</h2><p className="mt-2 text-sm text-slate-400">{body}</p></Card>)}
      </div>
      <Card hover={false} className="mt-4"><h2 className="font-semibold">Order details</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="panel p-3">Token: VLX</div><div className="panel p-3">Quantity: 250</div><div className="panel p-3">Status: Waiting</div></div></Card>
    </>
  );
}
