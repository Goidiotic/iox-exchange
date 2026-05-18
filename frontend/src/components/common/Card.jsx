import { motion } from 'framer-motion';
import { classNames } from '../../utils/format';

export default function Card({ children, className, hover = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -3 } : undefined}
      transition={{ duration: 0.25 }}
      className={classNames('glass rounded-lg p-4', className)}
    >
      {children}
    </motion.div>
  );
}
