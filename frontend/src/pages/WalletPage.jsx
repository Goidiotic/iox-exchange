import { BadgeCheck, LockKeyhole, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import PageHeader from '../components/common/PageHeader';
import Countdown from '../components/common/Countdown';
import FormField from '../components/forms/FormField';
import OTPInput from '../components/forms/OTPInput';

export default function WalletPage() {
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  return (
    <>
      <PageHeader title="M3 Wallet" eyebrow="Wallet management" />
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card hover={false}>
          <h2 className="font-semibold">Connect wallet</h2>
          <div className="mt-4 space-y-4">
            {step === 1 ? (
              <>
                <FormField label="Wallet mobile number">
                  <input className="field" placeholder="Wallet mobile number" />
                </FormField>
                <div className="flex items-center justify-between"><span className="text-sm text-slate-400">Platform OTP verification</span><Countdown seconds={90} label="Resend" /></div>
                <p className="text-sm font-medium text-slate-300">Platform OTP</p>
                <OTPInput value={otp} onChange={setOtp} />
                <Button className="w-full" onClick={() => setStep(2)}>Verify platform OTP</Button>
              </>
            ) : (
              <>
                <FormField label="Wallet sync key">
                  <input className="field" placeholder="Wallet sync key" />
                </FormField>
                <p className="text-sm font-medium text-slate-300">Wallet OTP</p>
                <OTPInput value={otp} onChange={setOtp} />
                <Button className="w-full" onClick={() => toast.success('Wallet connected')}>Verify wallet OTP</Button>
              </>
            )}
          </div>
        </Card>
        <Card hover={false}>
          <div className="flex items-center gap-3"><BadgeCheck className="text-acid" /><div><h2 className="font-semibold">Wallet verified</h2><p className="text-sm text-slate-400">Connected mobile: 98765 43210</p></div></div>
          <div className="mt-5 grid gap-3">
            <div className="panel p-3 text-sm">Connection date: 10 May 2026</div>
            <div className="panel p-3 text-sm">Status: Active and settlement-ready</div>
            <div className="panel p-3 text-sm">Rule: Only one wallet allowed. Wallet cannot be removed.</div>
          </div>
          <Button variant="secondary" className="mt-4 w-full" onClick={() => toast('Admin approval request created')}><ShieldAlert size={16} />Request extra wallet</Button>
        </Card>
      </div>
      <Card hover={false} className="mt-4"><LockKeyhole className="text-warn" /><p className="mt-3 text-sm text-slate-300">Extra wallet connections require admin approval and compliance review before use.</p></Card>
    </>
  );
}
