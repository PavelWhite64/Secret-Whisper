import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "только что";
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} м. назад`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч. назад`;
  
  const days = Math.floor(hours / 24);
  return `${days} д. назад`;
}
