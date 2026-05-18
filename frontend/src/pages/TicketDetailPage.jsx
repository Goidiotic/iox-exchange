import { Send } from 'lucide-react';
import { useParams } from 'react-router-dom';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import FormField from '../components/forms/FormField';
import PageHeader from '../components/common/PageHeader';
import Skeleton from '../components/common/Skeleton';
import { useMockQuery } from '../hooks/useMockQuery';
import { mockApi } from '../services/mockApi';

export default function TicketDetailPage() {
  const { ticketId } = useParams();
  const { data: ticket, isLoading } = useMockQuery(['ticket', ticketId], () => mockApi.ticket(ticketId));

  if (isLoading) return <Skeleton rows={3} />;

  return (
    <>
      <PageHeader title={ticket.subject} eyebrow={ticket.id} action={<Badge status={ticket.status === 'resolved' ? 'completed' : 'pending'}>{ticket.status.replace('_', ' ')}</Badge>} />
      <Card hover={false}>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="panel p-3"><p className="text-xs text-slate-500">Category</p><p className="mt-1 font-semibold">{ticket.category}</p></div>
          <div className="panel p-3"><p className="text-xs text-slate-500">Priority</p><p className="mt-1 font-semibold">{ticket.priority}</p></div>
          <div className="panel p-3"><p className="text-xs text-slate-500">Created</p><p className="mt-1 font-semibold">{ticket.createdAt}</p></div>
        </div>
        <div className="mt-5 space-y-3">
          {ticket.messages.map((message, index) => (
            <div key={index} className={`rounded-lg p-3 text-sm ${message.by === 'user' ? 'ml-auto bg-acid/10 text-slate-100' : 'mr-auto bg-white/[0.06] text-slate-200'} max-w-[85%]`}>
              <p>{message.body}</p>
              <p className="mt-2 text-[11px] text-slate-500">{message.by} - {message.at}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <FormField label="Reply message">
            <input className="field" placeholder="Reply to ticket" />
          </FormField>
          <Button><Send size={16} />Send</Button>
        </div>
      </Card>
    </>
  );
}
