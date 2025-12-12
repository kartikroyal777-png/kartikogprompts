export interface Prompt {
  id: string;
  short_id?: number;
  title: string;
  description: string;
  full_text?: string; // For premium prompts
  video_prompt?: string;
  author: string;
  author_id?: string; // ID of the creator
  creator_id?: string;
  image: string;
  images?: string[];
  category: string;
  likes: number;
  promptId: string;
  monetization_url?: string;
  instagram_handle?: string;
  is_liked?: boolean;
  is_paid?: boolean;
  price_credits?: number;
  is_unlocked?: boolean;
}

export type Category = 'All' | 'Couple' | 'Kids' | 'Men' | 'Women' | 'Animals' | 'Landscape';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  role: 'user' | 'creator' | 'admin';
  is_pro: boolean;
  pro_badge: boolean;
  creator_badge: boolean;
  created_at: string;
}

export interface CreatorProfile {
  id: string;
  bio: string;
  social_instagram?: string;
  social_youtube?: string;
  social_x?: string;
  website?: string;
  full_access_price_credits: number;
  created_at: string;
}

export interface Wallet {
  user_id: string;
  balance_credits: number;
}

export interface PayoutRequest {
  id: string;
  creator_id: string;
  credits_requested: number;
  usd_converted: number;
  status: 'pending' | 'paid' | 'failed';
  payout_ref: string;
  created_at: string;
  paid_at?: string;
  creator_name?: string; // Joined field
}
