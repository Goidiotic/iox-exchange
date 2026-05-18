import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import Button from '../components/common/Button';
import FormField from '../components/forms/FormField';
import { mockApi } from '../services/mockApi';
import { useAuthStore } from '../stores/authStore';

const schema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid Indian mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember: z.boolean().optional(),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { mobile: '', password: '', remember: true },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const response = await mockApi.login(values);
      login({ ...response, remember: values.remember });
      toast.success('Logged in successfully');
      navigate('/');
    } catch (error) {
      const message = error.message || 'Unable to login. Please check your mobile number and password.';
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Mobile number" error={errors.mobile}>
        <div className="relative"><Smartphone className="absolute left-3 top-3.5 text-slate-500" size={17} /><input className="field pl-10" {...register('mobile')} placeholder="9876543210" /></div>
      </FormField>
      <FormField label="Password" error={errors.password}>
        <div className="relative"><Lock className="absolute left-3 top-3.5 text-slate-500" size={17} /><input className="field pl-10" type="password" {...register('password')} placeholder="••••••••" /></div>
      </FormField>
      {serverError && <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{serverError}</div>}
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" className="accent-acid" {...register('remember')} /> Remember me</label>
        <Link className="text-cyanx hover:text-acid">Forgot password?</Link>
      </div>
      <Button className="w-full" disabled={isSubmitting}>Login</Button>
      <p className="text-center text-sm text-slate-400">New trader? <Link to="/register" className="text-cyanx">Create account</Link></p>
    </form>
  );
}
