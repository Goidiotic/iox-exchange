import { KeyRound, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Countdown from '../components/common/Countdown';
import PageHeader from '../components/common/PageHeader';
import FormField from '../components/forms/FormField';
import OTPInput from '../components/forms/OTPInput';
import { mockApi } from '../services/mockApi';
import { useAuthStore } from '../stores/authStore';

export default function TransactionPinPage() {
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const updateUser = useAuthStore((state) => state.updateUser);
  const returnTo = location.state?.from || '/market';

  const requestOtp = async () => {
    setLoading(true);
    try {
      const response = await mockApi.requestTransactionPinOtp();
      setOtpSent(true);
      setDevOtp(response.devOtp || '');
      toast.success('OTP sent to your registered mobile');
    } catch (error) {
      toast.error(error.message || 'Unable to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const savePin = async (event) => {
    event.preventDefault();
    if (otp.length !== 6) {
      toast.error('Enter 6 digit OTP');
      return;
    }
    if (!/^\d{4,6}$/.test(pin)) {
      toast.error('Transaction PIN must be 4 to 6 digits');
      return;
    }
    if (pin !== confirmPin) {
      toast.error('PIN confirmation does not match');
      return;
    }
    setLoading(true);
    try {
      await mockApi.setupTransactionPin({ otp, pin });
      updateUser({ hasTransactionPin: true });
      toast.success('Transaction PIN created');
      navigate(returnTo, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Unable to create Transaction PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Transaction PIN" eyebrow="Secure sell authorization" />
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card hover={false}>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-acid/15 text-acid">
              <KeyRound size={22} />
            </div>
            <div>
              <h2 className="font-semibold">Create Transaction PIN</h2>
              <p className="mt-1 text-sm text-slate-400">Required before placing a sell order.</p>
            </div>
          </div>

          <form className="mt-5 space-y-4" onSubmit={savePin}>
            {!otpSent ? (
              <Button type="button" className="w-full" onClick={requestOtp} disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send Platform OTP'}
              </Button>
            ) : (
              <>
                <div className="panel p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Platform OTP</span>
                    <Countdown seconds={90} label="Resend in" />
                  </div>
                  <OTPInput value={otp} onChange={setOtp} />
                  {devOtp && <p className="mt-3 text-xs text-slate-500">Development OTP: {devOtp}</p>}
                </div>
                <FormField label="New Transaction PIN">
                  <input
                    className="field"
                    inputMode="numeric"
                    maxLength={6}
                    type="password"
                    value={pin}
                    onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="4 to 6 digits"
                  />
                </FormField>
                <FormField label="Confirm Transaction PIN">
                  <input
                    className="field"
                    inputMode="numeric"
                    maxLength={6}
                    type="password"
                    value={confirmPin}
                    onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Re-enter PIN"
                  />
                </FormField>
                <Button className="w-full" disabled={loading}>
                  {loading ? 'Creating PIN...' : 'Create Transaction PIN'}
                </Button>
              </>
            )}
          </form>
        </Card>

        <Card hover={false}>
          <ShieldCheck className="text-cyanx" />
          <h2 className="mt-3 font-semibold">Sell protection</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-300">
            <p className="panel p-3">The PIN is requested only when authorizing sell orders.</p>
            <p className="panel p-3">OTP is sent through the platform OTP system before the PIN is created.</p>
            <p className="panel p-3">Admin verification is still required before the sell order appears on Market.</p>
          </div>
        </Card>
      </div>
    </>
  );
}
