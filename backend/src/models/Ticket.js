import mongoose from 'mongoose';

const ticketMessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    senderRole: { type: String, enum: ['user', 'admin', 'system'], default: 'user' },
    body: { type: String, required: true },
    attachments: [String],
  },
  { timestamps: true },
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNo: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true },
    category: { type: String, enum: ['Payment', 'Wallet', 'Order', 'Rewards', 'Account', 'Other'], default: 'Other', index: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium', index: true },
    status: { type: String, enum: ['open', 'in_review', 'resolved', 'closed'], default: 'open', index: true },
    messages: [ticketMessageSchema],
    lastReplyAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

export const Ticket = mongoose.model('Ticket', ticketSchema);
