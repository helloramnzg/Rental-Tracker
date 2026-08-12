import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Single-letter avatar fallback for the landlord's name, e.g. in the
// sidebar/topbar user menu. Falls back to "L" (for "Landlord") when no
// name has been set in Settings yet.
export function getInitial(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed[0]!.toUpperCase() : "L";
}
