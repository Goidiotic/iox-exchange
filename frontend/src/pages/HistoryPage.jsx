import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import FormField from '../components/forms/FormField';
import PageHeader from '../components/common/PageHeader';
import Skeleton from '../components/common/Skeleton';
import { useMockQuery } from '../hooks/useMockQuery';
import { mockApi } from '../services/mockApi';

export default function HistoryPage() {
  const { data = [], isLoading } = useMockQuery('history', mockApi.history);
  if (isLoading) return <Skeleton rows={4} />;
  return (
    <>
      <PageHeader title="Transaction History" eyebrow="Buy, sell, rewards, coupons and referrals" />
      <Card hover={false}>
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_180px]">
          <FormField label="Search transaction ID">
            <input className="field" placeholder="Search transaction ID" />
          </FormField>
          <FormField label="Transaction type">
            <select className="field"><option>All types</option><option>Buy</option><option>Sell</option><option>Reward</option></select>
          </FormField>
          <FormField label="Status">
            <select className="field"><option>All statuses</option><option>Completed</option><option>Pending</option></select>
          </FormField>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="text-slate-500"><tr><th className="py-3">ID</th><th>Type</th><th>Token</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>{data.map((row) => <tr className="border-t border-line" key={row.id}><td className="py-3 font-mono">{row.id}</td><td>{row.type}</td><td>{row.token}</td><td>{row.amount}</td><td><Badge status={row.status}>{row.status}</Badge></td><td>{row.date}</td></tr>)}</tbody></table></div>
        <div className="mt-4 flex justify-end gap-2"><button className="btn-secondary py-2">Previous</button><button className="btn-secondary py-2">Next</button></div>
      </Card>
    </>
  );
}
