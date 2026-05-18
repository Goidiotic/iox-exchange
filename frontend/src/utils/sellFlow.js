import { formatINR } from './format';

export const defaultQuickSellFees = {
  processingFeePercentage: 0.5,
  burnPercentage: 1,
  paymentGatewayPercentage: 2,
};

export const quickSellFeeRowsFor = (grossAmount, quickSellFees = defaultQuickSellFees) => [
  ['Processing Fees', quickSellFees.processingFeePercentage],
  ['Quick Sell Burn', quickSellFees.burnPercentage],
  ['Payment Gateway Charge', quickSellFees.paymentGatewayPercentage],
].map(([label, percentage]) => ({
  label,
  percentage: Number(percentage || 0),
  amount: (grossAmount * Number(percentage || 0)) / 100,
}));

export const calculateSellQuote = ({ amount, token, sellType, quickSellFees }) => {
  const grossAmount = Number(amount || 0) * Number(token?.price || 0);
  const feeRows = sellType === 'quick' ? quickSellFeeRowsFor(grossAmount, quickSellFees) : [];
  const totalFees = feeRows.reduce((sum, fee) => sum + fee.amount, 0);
  const finalReceivable = Math.max(grossAmount - totalFees, 0);

  return {
    grossAmount,
    feeRows,
    totalFees,
    finalReceivable,
    finalReceivableLabel: formatINR(finalReceivable),
  };
};
