import { useEffect, useMemo, useState } from 'react';

export const useCountdown = (initialSeconds) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const seconds = (secondsLeft % 60).toString().padStart(2, '0');
    return { secondsLeft, label: `${minutes}:${seconds}`, expired: secondsLeft === 0, reset: () => setSecondsLeft(initialSeconds) };
  }, [initialSeconds, secondsLeft]);
};
