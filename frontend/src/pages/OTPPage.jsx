import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Countdown from '../components/common/Countdown';
import OTPInput from '../components/forms/OTPInput';
import { mockApi } from '../services/mockApi';

export default function OTPPage() {
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();
  const verify = async () => {
    if (otp.length !== 6) return toast.error('Enter a valid OTP');
    await mockApi.verifyOtp(otp);
    toast.success('OTP verified');
    navigate('/');
  };
  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-semibold">OTP Verification</h2><p className="mt-1 text-sm text-slate-400">Enter the 6 digit code sent to your registered mobile.</p></div>
      <OTPInput value={otp} onChange={setOtp} />
      <div className="flex items-center justify-between"><Countdown seconds={90} label="Resend in" /><button className="text-sm text-cyanx" onClick={() => toast.success('OTP resent')}>Resend OTP</button></div>
      <Button className="w-full" onClick={verify}>Verify OTP</Button>
    </div>
  );
}
