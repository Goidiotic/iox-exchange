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
}).refine((data) => data.password === data.confirmPassword, { path: ['confirmPassword'], message: 'Passwords must match' });

export default function ForgotPasswordPage() {
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    if (!otpSent) {
      await mockApi.requestPasswordReset({ mobile: values.mobile });
      setOtpSent(true);
      toast.success('Password reset OTP sent');
      return;
    }
    if (otp.length !== 6) {
      toast.error('Enter 6 digit OTP');
      return;
    }
    const formValues = getValues();
    await mockApi.resetPassword({ mobile: formValues.mobile, otp, password: formValues.password });
    toast.success('Password updated');
    navigate('/login');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-white">Forgot Password</h1>
        <p className="mt-1 text-sm text-slate-400">Verify your mobile number with OTP and set a new password.</p>
      </div>
      <FormField label="Mobile number" error={errors.mobile}><input className="field" {...register('mobile')} placeholder="9876543210" /></FormField>
      <FormField label="New password" error={errors.password}><input className="field" type="password" {...register('password')} /></FormField>
      <FormField label="Confirm new password" error={errors.confirmPassword}><input className="field" type="password" {...register('confirmPassword')} /></FormField>
      {otpSent && (
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between"><span className="text-sm text-slate-300">Verify OTP</span><Countdown seconds={90} label="Resend in" /></div>
          <OTPInput value={otp} onChange={setOtp} />
        </div>
      )}
      <Button className="w-full" disabled={isSubmitting}>{otpSent ? 'Verify & Reset Password' : 'Send OTP'}</Button>
      <p className="text-center text-sm text-slate-400">Remembered password? <Link to="/login" className="text-cyanx">Login</Link></p>
    </form>
  );
}
