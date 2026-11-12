import { formatDistanceStrict, format, parseISO } from "date-fns";

export function relativeAge(iso: string, now = new Date()): string {
  try {
    return formatDistanceStrict(parseISO(iso), now, { addSuffix: true });
  } catch {
    return "";
  }
}

export function formatLocal(iso: string, pattern = "MMM d · h:mm a"): string {
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return iso;
  }
}

export function hoursBetween(startIso: string, endIso?: string | null): number {
  const start = parseISO(startIso).getTime();
  const end = endIso ? parseISO(endIso).getTime() : Date.now();
  return Math.max(0, (end - start) / 3_600_000);
}

export function minutesBetween(startIso: string, endIso?: string | null): number {
  return hoursBetween(startIso, endIso) * 60;
}

export function dayKey(iso: string): string {
  return format(parseISO(iso), "yyyy-MM-dd");
}
