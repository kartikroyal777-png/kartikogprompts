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
  category: string; 
  categories: string[]; 
  created_at?: string;
  likes: number;
  is_liked?: boolean;
  is_favorite?: boolean;
  is_paid?: boolean;
  is_bundle?: boolean;
  monetization_url?: string;
  instagram_handle?: string;
  prompt_type: 'standard' | 'product';
}

export interface SuperPromptCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  sort_order: number;
}

export interface SuperPrompt {
  id: string;
  category_id: string;
  title: string;
  what_it_does: string;
  prompt_content: string;
  how_to_use: string;
  example_output_images: string[];
  is_premium: boolean;
  created_at: string;
  likes_count: number;
  is_favorite?: boolean;
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

export interface UserProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  email?: string;
  role?: 'user' | 'creator' | 'admin';
  creator_badge?: boolean;
  usd_balance?: number;
  ebook_access?: boolean;
  plan_type?: 'free' | 'pro';
  referred_by?: string;
  affiliate_earnings_credits?: number;
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

// Image to JSON Types
export interface ImageAnalysisResult {
  metadata: {
    confidence_score: string;
    image_type: string;
    primary_purpose: string;
  };
  composition: any;
  color_profile: any;
  lighting: any;
  technical_specs: any;
  artistic_elements: any;
  subject_analysis: any;
  background: any;
  generation_parameters: {
    prompts: string[];
    keywords: string[];
    technical_settings: string;
    post_processing: string;
  };
}
