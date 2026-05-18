import { useEffect, useMemo, useState } from 'react';

export const usePreciseCountdown = (initialMs) => {
  const [remainingMs, setRemainingMs] = useState(initialMs);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setRemainingMs(Math.max(0, initialMs - elapsed));
    }, 37);

    return () => window.clearInterval(timer);
  }, [initialMs]);

  return useMemo(() => {
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000).toString().padStart(2, '0');
    const milliseconds = Math.floor((remainingMs % 1000) / 10).toString().padStart(2, '0');
    const progress = initialMs > 0 ? Math.max(0, Math.min(100, (remainingMs / initialMs) * 100)) : 0;

    return {
      remainingMs,
      progress,
      label: `${minutes}:${seconds}:${milliseconds}`,
      expired: remainingMs === 0,
    };
  }, [initialMs, remainingMs]);
};
