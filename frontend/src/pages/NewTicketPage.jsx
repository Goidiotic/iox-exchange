import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import PageHeader from '../components/common/PageHeader';
import FormField from '../components/forms/FormField';
import { mockApi } from '../services/mockApi';

const schema = z.object({
  subject: z.string().min(4, 'Subject is required'),
  category: z.string().min(1, 'Select category'),
  priority: z.string().min(1, 'Select priority'),
  message: z.string().min(10, 'Describe your issue in at least 10 characters'),
});

export default function NewTicketPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { category: 'Payment', priority: 'Medium' },
  });

  const submit = async (values) => {
    const ticket = await mockApi.createTicket(values);
    toast.success('Ticket created');
    navigate(`/tickets/${ticket.id}`);
  };

  return (
    <>
      <PageHeader title="New Ticket" eyebrow="Create support request" />
      <Card hover={false}>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <FormField label="Subject" error={errors.subject}><input className="field" {...register('subject')} placeholder="Short issue title" /></FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Category" error={errors.category}>
              <select className="field" {...register('category')}><option>Payment</option><option>Wallet</option><option>Order</option><option>Rewards</option><option>Account</option></select>
            </FormField>
            <FormField label="Priority" error={errors.priority}>
              <select className="field" {...register('priority')}><option>Low</option><option>Medium</option><option>High</option></select>
            </FormField>
          </div>
          <FormField label="Message" error={errors.message}><textarea className="field min-h-32" {...register('message')} placeholder="Explain what happened" /></FormField>
          <Button disabled={isSubmitting}>Create Ticket</Button>
        </form>
      </Card>
    </>
  );
}
