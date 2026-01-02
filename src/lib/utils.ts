import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { supabase } from './supabase';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Helper to get a robust public URL for an image.
 * Handles:
 * 1. Full HTTP URLs (external)
 * 2. Relative storage paths
 * 3. Fallbacks
 */
export function getImageUrl(path: string | null | undefined, fallbackText: string = 'No Image'): string {
  if (!path) {
    return `https://img-wrapper.vercel.app/image?url=https://placehold.co/600x800/1e293b/FFF?text=${encodeURIComponent(fallbackText)}`;
  }

  if (path.startsWith('http') || path.startsWith('https')) {
    return path;
  }

  // Generate Supabase Public URL
  const { data } = supabase.storage.from('prompt-images').getPublicUrl(path);
  return data.publicUrl;
}
