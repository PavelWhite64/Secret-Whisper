import { useState, useEffect } from "react";
import { differenceInSeconds } from "date-fns";

export function useCountdown(expiresAt: string) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const targetDate = new Date(expiresAt);

    const updateCountdown = () => {
      const seconds = differenceInSeconds(targetDate, new Date());
      setTimeLeft(seconds > 0 ? seconds : 0);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (timeLeft === null) return "";
  if (timeLeft <= 0) return "Истёк";

  const d = Math.floor(timeLeft / (3600 * 24));
  const h = Math.floor((timeLeft % (3600 * 24)) / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;

  if (d > 0) return `${d}д ${h}ч`;
  if (h > 0) return `${h}ч ${m}м`;
  if (m > 0) return `${m}м ${s}с`;
  return `${s}с`;
}
