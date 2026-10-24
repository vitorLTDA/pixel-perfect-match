import { format, formatDistanceToNow } from "date-fns";

export const money = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
export const when = (iso: string) => format(new Date(iso), "EEE d MMM · HH:mm");
export const day = (iso: string) => format(new Date(iso), "d MMM yyyy");
export const ago = (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true });
export const hours = (h: number) => (h < 1 ? `${h * 60} min` : `${h} h`);
export const initials = (name: string) =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
