import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import PageHeader from '../components/common/PageHeader';

export default function ReferralsPage() {
  const code = 'IOX-COIN-8421';
  const stats = [['L1 referrals', 18], ['L2 referrals', 47], ['Rebate earnings', '₹8,920']];
  return (
    <>
      <PageHeader title="Referral System" eyebrow="Two-level rebate module" />
      <Card hover={false}>
        <p className="text-sm text-slate-400">Referral code</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row"><div className="field flex-1 font-mono">{code}</div><Button onClick={() => { navigator.clipboard?.writeText(code); toast.success('Referral code copied'); }}><Copy size={16} />Copy</Button></div>
      </Card>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">{stats.map(([label, value]) => <Card key={label}><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></Card>)}</div>
      <Card hover={false} className="mt-4"><h2 className="font-semibold">Referral history</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><tbody>{['L1 user joined', 'L2 rebate credited', 'L1 trader completed buy'].map((row, index) => <tr className="border-b border-line" key={row}><td className="py-3">{row}</td><td>REF-{index + 101}</td><td className="text-acid">Completed</td></tr>)}</tbody></table></div></Card>
    </>
  );
}
