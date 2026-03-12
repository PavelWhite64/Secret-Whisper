import { useState, useEffect } from "react";

export type TimeColor = "green" | "yellow" | "red" | "gray";

export function useCountdown(createdAtStr: string, expiresAtStr: string) {
  const [timeLeft, setTimeLeft] = useState("");
  const [color, setColor] = useState<TimeColor>("gray");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const createdAt = new Date(createdAtStr).getTime();
    const expiresAt = new Date(expiresAtStr).getTime();
    const totalLifetime = expiresAt - createdAt;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = expiresAt - now;

      if (remaining <= 0) {
        setTimeLeft("Мёртв");
        setColor("gray");
        setIsExpired(true);
        return;
      }

      setIsExpired(false);
      
      // Calculate color based on percentage remaining
      const percentageLeft = (remaining / totalLifetime) * 100;
      if (percentageLeft > 50) setColor("green");
      else if (percentageLeft > 20) setColor("yellow");
      else setColor("red");

      // Format time
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        const remHours = hours % 24;
        setTimeLeft(`${days}д ${remHours}ч`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}ч ${minutes}м`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}м ${seconds}с`);
      } else {
        setTimeLeft(`${seconds}с`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [createdAtStr, expiresAtStr]);

  return { timeLeft, color, isExpired };
}
