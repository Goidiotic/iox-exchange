import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import Button from '../components/common/Button';
import Countdown from '../components/common/Countdown';
import FormField from '../components/forms/FormField';
import OTPInput from '../components/forms/OTPInput';
import { mockApi } from '../services/mockApi';

const schema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid Indian mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  referral: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, { path: ['confirmPassword'], message: 'Passwords must match' });

export default function RegisterPage() {
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    if (!otpSent) {
      await mockApi.register(values);
      setOtpSent(true);
      toast.success('OTP sent');
      return;
    }
    if (otp.length !== 6) {
      toast.error('Enter 6 digit OTP');
      return;
    }
    const formValues = getValues();
    await mockApi.verifyOtp({ mobile: formValues.mobile, otp });
    toast.success('Registration verified');
    navigate('/login');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Mobile number" error={errors.mobile}><input className="field" {...register('mobile')} placeholder="9876543210" /></FormField>
      <FormField label="Password" error={errors.password}><input className="field" type="password" {...register('password')} /></FormField>
      <FormField label="Confirm password" error={errors.confirmPassword}><input className="field" type="password" {...register('confirmPassword')} /></FormField>
      <FormField label="Referral code optional" error={errors.referral}><input className="field" {...register('referral')} placeholder="REF-INR-2026" /></FormField>
      {otpSent && (
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between"><span className="text-sm text-slate-300">Verify OTP</span><Countdown seconds={90} label="Resend in" /></div>
          <OTPInput value={otp} onChange={setOtp} />
        </div>
      )}
      <Button className="w-full" disabled={isSubmitting}>{otpSent ? 'Verify & Register' : 'Send OTP'}</Button>
      <p className="text-center text-sm text-slate-400">Already registered? <Link to="/login" className="text-cyanx">Login</Link></p>
    </form>
  );
}
