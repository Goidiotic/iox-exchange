import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    symbol: { type: String, required: true, unique: true, uppercase: true, index: true },
    fixedPrice: { type: Number, required: true, min: 0 },
    rewardPercentage: { type: Number, default: 0, min: 0 },
    logo: String,
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const Token = mongoose.model('Token', tokenSchema);
