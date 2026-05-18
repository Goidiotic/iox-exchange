import { X } from 'lucide-react';
import Button from '../common/Button';

export default function ConfirmModal({ open, title, body, confirmLabel = 'Confirm', onConfirm, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-md rounded-lg p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-slate-400">{body}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/10" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
