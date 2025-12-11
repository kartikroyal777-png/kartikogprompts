export interface Prompt {
  id: string;
  short_id?: number; // Added short_id
  title: string;
  description: string;
  video_prompt?: string;
  author: string;
  author_id?: string;
  image: string;
  images?: string[];
  category: string;
  likes: number;
  promptId: string; // The visible ID (now mapped to short_id)
  monetization_url?: string;
  instagram_handle?: string;
  is_liked?: boolean;
}

export type Category = 'All' | 'Couple' | 'Kids' | 'Men' | 'Women' | 'Animals' | 'Landscape';
