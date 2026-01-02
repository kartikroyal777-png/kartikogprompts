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
  // If no path is provided, return a direct placeholder (NO PROXY)
  if (!path) {
    return `https://img-wrapper.vercel.app/image?url=https://placehold.co/600x800/1e293b/FFF?text=${encodeURIComponent(fallbackText)}`;
  }

  // If it's already a full URL, return it
  if (path.startsWith('http') || path.startsWith('https')) {
    return path;
  }

  // Clean path to remove any leading slashes which can break Supabase URLs
  const cleanPath = path.replace(/^\/+/, '');

  // Generate Supabase Public URL for storage paths
  const { data } = supabase.storage.from('prompt-images').getPublicUrl(cleanPath);
  
  return data.publicUrl;
}
