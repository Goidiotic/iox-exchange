import mongoose from 'mongoose';

const adminLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true },
    entity: String,
    entityId: mongoose.Schema.Types.ObjectId,
    ip: String,
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true },
);

export const AdminLog = mongoose.model('AdminLog', adminLogSchema);
