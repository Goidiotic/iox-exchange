import { Transaction } from '../models/Transaction.js';

export const transactionService = {
  async list(user, query = {}) {
    const filter = { user: user._id };
    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.search) filter.transactionNo = new RegExp(query.search, 'i');
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 20);
    const [rows, total] = await Promise.all([
      Transaction.find(filter).populate('token order').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Transaction.countDocuments(filter),
    ]);
    return { rows, total, page, pages: Math.ceil(total / limit) };
  },
};
