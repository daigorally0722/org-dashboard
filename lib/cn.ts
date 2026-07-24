import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind クラスを安全に結合するヘルパー。 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
