import { useState } from 'react';
import { Bell, CheckCircle2, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import FormField from '../components/forms/FormField';
import { useAuthStore } from '../stores/authStore';

const updateOptions = [
  'Buy order placed',
  'Sell order placed',
  'Buy completed',
  'Sell completed',
  'Password change',
  'Wallet connected',
  'Newsletter',
  'Promo',
  'Platform updates',
  'Other updates',
];

export default function ProfileDetailsPage() {
  const user = useAuthStore((state) => state.user);
  const mobile = user?.mobile || '9876543210';
  const displayName = user?.name || 'IOX Trader';
  const [email, setEmail] = useState('');
  const [enabledUpdates, setEnabledUpdates] = useState(() => new Set(updateOptions));
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

  const toggleUpdate = (option) => {
    setEnabledUpdates((current) => {
      const next = new Set(current);
      if (next.has(option)) {
        next.delete(option);
      } else {
        next.add(option);
      }
      return next;
    });
  };

  const saveEmail = (event) => {
    event.preventDefault();
    toast.success('Email update preferences saved');
  };

  const changePassword = (event) => {
    event.preventDefault();

    if (!passwords.next || passwords.next.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (passwords.next !== passwords.confirm) {
      toast.error('Passwords do not match');
      return;
    }

    setPasswords({ current: '', next: '', confirm: '' });
    toast.success('Password change request submitted');
  };

  return (
    <div className="space-y-4 overflow-x-hidden">
      <Card hover={false} className="p-5">
        <div className="flex items-start gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-acid to-cyanx text-ink">
            <UserRound size={28} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold text-white">{displayName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-400">UID IOX-{mobile.slice(-6)}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-acid/40 bg-acid/10 px-2 py-1 text-xs font-medium text-acid">
                <ShieldCheck size={13} /> Verified
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-400">Mobile {mobile}</p>
          </div>
        </div>
      </Card>

      <Card hover={false} className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/[0.07] text-acid">
            <Mail size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-white">Email updates</h2>
            <p className="text-sm text-slate-500">Choose the platform updates you want by email.</p>
          </div>
        </div>

        <form onSubmit={saveEmail} className="space-y-4">
          <FormField label="Email address">
            <input
              className="field"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </FormField>

          <div className="grid gap-2 sm:grid-cols-2">
            {updateOptions.map((option) => {
              const checked = enabledUpdates.has(option);
              return (
                <label key={option} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white/[0.035] px-3 py-3">
                  <span className="flex items-center gap-2 text-sm text-slate-100">
                    {checked ? <CheckCircle2 size={16} className="text-acid" /> : <Bell size={16} className="text-slate-500" />}
                    {option}
                  </span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleUpdate(option)}
                    className="h-4 w-4 accent-[#31f59f]"
                  />
                </label>
              );
            })}
          </div>

          <Button type="submit" className="w-full sm:w-auto">Save email updates</Button>
        </form>
      </Card>

      <Card hover={false} className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/[0.07] text-acid">
            <LockKeyhole size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-white">Change Password</h2>
            <p className="text-sm text-slate-500">Update your account login password.</p>
          </div>
        </div>

        <form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-2">
          <FormField label="Current password">
            <input
              className="field"
              type="password"
              value={passwords.current}
              onChange={(event) => setPasswords((current) => ({ ...current, current: event.target.value }))}
            />
          </FormField>
          <FormField label="New password">
            <input
              className="field"
              type="password"
              value={passwords.next}
              onChange={(event) => setPasswords((current) => ({ ...current, next: event.target.value }))}
            />
          </FormField>
          <FormField label="Confirm new password">
            <input
              className="field"
              type="password"
              value={passwords.confirm}
              onChange={(event) => setPasswords((current) => ({ ...current, confirm: event.target.value }))}
            />
          </FormField>
          <div className="flex items-end">
            <Button type="submit" className="w-full">Change Password</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
