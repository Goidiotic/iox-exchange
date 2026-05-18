import { Plus, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import PageHeader from '../components/common/PageHeader';
import Skeleton from '../components/common/Skeleton';
import { useMockQuery } from '../hooks/useMockQuery';
import { mockApi } from '../services/mockApi';

export default function TicketsPage() {
  const { data = [], isLoading } = useMockQuery('tickets', mockApi.tickets);

  if (isLoading) return <Skeleton rows={4} />;

  return (
    <>
      <PageHeader title="Tickets" eyebrow="Support requests" action={<Link to="/tickets/new"><Button><Plus size={16} />New Ticket</Button></Link>} />
      {data.length === 0 ? (
        <EmptyState title="No tickets" body="Your support tickets will appear here." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-white/[0.045]">
          {data.map((ticket) => (
            <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="flex items-start gap-3 border-b border-line px-4 py-4 last:border-b-0 hover:bg-white/[0.06]">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-acid/15 text-acid">
                <Ticket size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-semibold text-white">{ticket.subject}</h2>
                  <Badge status={ticket.status === 'resolved' ? 'completed' : 'pending'}>{ticket.status.replace('_', ' ')}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-400">{ticket.id} - {ticket.category} - {ticket.priority}</p>
                <p className="mt-1 text-xs text-slate-500">Updated {ticket.lastUpdate}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
