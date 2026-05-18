import { STATUS_COLORS } from '../../constants/tokens';
import { classNames } from '../../utils/format';

export default function Badge({ children, status = 'verified', className }) {
  const key = status.includes('pending')
    ? 'pending'
    : status.includes('awaiting')
      ? 'awaiting'
      : status.includes('review')
        ? 'review'
        : status;
  return <span className={classNames('badge', STATUS_COLORS[key] || STATUS_COLORS.verified, className)}>{children}</span>;
}
