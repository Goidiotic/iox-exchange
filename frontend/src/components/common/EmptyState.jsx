import { Inbox } from 'lucide-react';

export default function EmptyState({ title, body }) {
  return (
    <div className="panel flex min-h-48 flex-col items-center justify-center gap-3 p-8 text-center">
      <Inbox className="text-slate-500" size={32} />
      <div>
        <h3 className="font-semibold text-slate-100">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{body}</p>
      </div>
    </div>
  );
}
