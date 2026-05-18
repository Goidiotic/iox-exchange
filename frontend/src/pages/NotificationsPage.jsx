import { BellRing } from 'lucide-react';
import Card from '../components/common/Card';
import PageHeader from '../components/common/PageHeader';
import Skeleton from '../components/common/Skeleton';
import { useMockQuery } from '../hooks/useMockQuery';
import { mockApi } from '../services/mockApi';

export default function NotificationsPage() {
  const { data = [], isLoading } = useMockQuery('notifications', mockApi.notifications);
  if (isLoading) return <Skeleton rows={4} />;
  return (
    <>
      <PageHeader title="Notification Center" eyebrow="Transaction, reward, coupon, referral and wallet alerts" />
      <div className="grid gap-3">{data.map((item) => <Card key={item.title} hover={false} className="flex gap-4"><BellRing className="mt-1 text-cyanx" size={20} /><div><p className="font-semibold">{item.title}</p><p className="mt-1 text-sm text-slate-400">{item.body}</p><p className="mt-2 text-xs uppercase text-acid">{item.type}</p></div></Card>)}</div>
    </>
  );
}
