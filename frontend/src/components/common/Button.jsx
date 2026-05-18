import { classNames } from '../../utils/format';

export default function Button({ children, variant = 'primary', className, ...props }) {
  return (
    <button className={classNames(variant === 'primary' ? 'btn-primary' : 'btn-secondary', className)} {...props}>
      {children}
    </button>
  );
}
