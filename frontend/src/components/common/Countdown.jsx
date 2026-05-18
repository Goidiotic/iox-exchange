import { Clock } from 'lucide-react';
import { useCountdown } from '../../hooks/useCountdown';

export default function Countdown({ seconds, label = 'Time left', tone = 'text-acid' }) {
  const timer = useCountdown(seconds);
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-line bg-black/25 px-3 py-2">
      <Clock size={16} className={tone} />
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`font-mono text-sm font-semibold ${timer.expired ? 'text-red-300' : tone}`}>{timer.label}</span>
    </div>
  );
}
