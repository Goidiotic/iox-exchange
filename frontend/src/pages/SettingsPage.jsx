import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import PageHeader from '../components/common/PageHeader';
import ConfirmModal from '../components/modals/ConfirmModal';
import FormField from '../components/forms/FormField';
import OTPInput from '../components/forms/OTPInput';
import { useTradingStore } from '../stores/tradingStore';

export default function SettingsPage() {
  const autoSellEnabled = useTradingStore((state) => state.autoSellEnabled);
  const setAutoSellEnabled = useTradingStore((state) => state.setAutoSellEnabled);
  const [modalOpen, setModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  return (
    <>
      <PageHeader title="Profile & Settings" eyebrow="Security and trading controls" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card hover={false}><h2 className="font-semibold">Profile</h2><div className="mt-4 grid gap-3"><FormField label="Mobile number"><input className="field" value="9876543210" readOnly /></FormField><div className="panel p-3 text-sm">KYC status: Optional, not submitted</div><FormField label="New password"><input className="field" type="password" placeholder="New password" /></FormField></div></Card>
        <Card hover={false}><h2 className="font-semibold">Security settings</h2><div className="mt-4 grid gap-3"><div className="panel p-3 text-sm">Login activity: Last login 10 May 2026, Asia/Calcutta</div><div className="panel p-3 text-sm">Notifications: Transaction, reward, coupon and wallet alerts enabled</div></div></Card>
      </div>
      <Card hover={false} className="mt-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-semibold">Auto Sell by Platform</h2><p className="mt-1 text-sm text-slate-400">Wallet verification is required before this setting can execute platform auto sell orders.</p></div>
          <button onClick={() => setModalOpen(true)} className={`relative h-8 w-14 rounded-full transition ${autoSellEnabled ? 'bg-acid' : 'bg-slate-700'}`} aria-label="Toggle auto sell"><span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${autoSellEnabled ? 'left-7' : 'left-1'}`} /></button>
        </div>
        <div className="mt-4 panel border-warn/30 p-3 text-sm text-warn">Wallet verification required warning: auto sell cannot settle without a connected M3 Wallet.</div>
      </Card>
      <ConfirmModal
        open={modalOpen}
        title={`${autoSellEnabled ? 'Disable' : 'Enable'} Auto Sell`}
        body="Two-step verification is required before changing platform auto sell preferences."
        confirmLabel="Continue"
        onClose={() => setModalOpen(false)}
        onConfirm={() => {
          if (otp.length !== 6) return toast.error('Enter 6 digit verification OTP');
          setAutoSellEnabled(!autoSellEnabled);
          setModalOpen(false);
          setOtp('');
          toast.success('Auto sell setting updated');
        }}
      />
      {modalOpen && <div className="fixed inset-x-4 bottom-5 z-[60] mx-auto max-w-md rounded-lg border border-line bg-panel p-4"><p className="mb-3 text-sm font-medium text-slate-300">Wallet OTP verification</p><OTPInput value={otp} onChange={setOtp} /></div>}
    </>
  );
}
