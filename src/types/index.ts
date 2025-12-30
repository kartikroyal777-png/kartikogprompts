export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface CreatorProfile {
  id: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  cover_image_url: string;
  instagram_url?: string;
  twitter_url?: string;
  website_url?: string;
  total_sales: number;
  total_earnings: number;
  rating: number;
  joined_at: string;
  usd_balance?: number;
  full_access_price_credits: number;
  social_instagram?: string;
  social_youtube?: string;
  website?: string;
}

export interface Prompt {
  id: string;
  short_id?: number;
  promptId: string;
  title: string;
  description: string;
  full_text?: string;
  video_prompt?: string;
  price_credits?: number;
  images: string[];
  image: string;
  tags?: string[];
  author: string;
  creator_id?: string;
  category: string; // Keep for backward compatibility display
  categories: string[]; // New multi-category support
  created_at?: string;
  likes: number;
  is_liked?: boolean;
  is_paid?: boolean;
  is_bundle?: boolean;
  monetization_url?: string;
  instagram_handle?: string;
}

export interface PromptContent {
  id: string;
  prompt_id: string;
  full_text: string;
  bundle_data?: {
    index: number;
    text: string;
  }[];
}

export interface Wallet {
  id?: string;
  user_id: string;
  balance_credits: number;
  balance?: number;
  withdrawable_credits?: number;
  updated_at: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  email?: string;
  role?: 'user' | 'creator' | 'admin';
  creator_badge?: boolean;
  usd_balance?: number;
  ebook_access?: boolean;
}

export type Category = 'All' | 'Couple' | 'Kids' | 'Men' | 'Women' | 'Animals' | 'Landscape';

export interface PayoutRequest {
  id: string;
  creator_id: string;
  credits_requested: number;
  usd_converted: number;
  status: 'pending' | 'paid' | 'rejected';
  payout_ref: string;
  created_at: string;
  creator_name?: string;
}

export interface Subscriber {
  user_id: string;
  unlocked_at: string;
}

export interface EarningEntry {
  sender_id: string;
  amount: number;
  created_at: string;
  prompt_title: string;
}

// Rate Me Types
export interface RateMeParameters {
  // Core Metrics
  face: number;
  outfit: number;
  eyes: number;
  jawline: number;
  skin: number;
  overall: number;
  
  // Detailed Metrics (New)
  symmetry?: number;
  canthal_tilt?: number;
  cheekbones?: number;
  nose?: number;

  roast?: string;
  toast?: string;
}

export interface RateMeEntry {
  id: string;
  user_id: string;
  image_url: string;
  gender: 'Men' | 'Women';
  parameters: RateMeParameters;
  ai_base_score: number;
  vote_offset: number;
  final_score: number;
  is_published: boolean;
  player_name?: string; // Custom name for leaderboard
  social_links: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  created_at: string;
  user_profile?: {
    full_name: string;
    avatar_url: string;
  };
}
