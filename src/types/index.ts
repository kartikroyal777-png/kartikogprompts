export interface Prompt {
  id: string;
  title: string;
  description: string;
  video_prompt?: string; // Added video prompt
  author: string;
  author_id?: string;
  image: string;
  category: string;
  likes: number;
  promptId: string; // The visible ID like "10010"
  monetization_url?: string;
  instagram_handle?: string;
  is_liked?: boolean;
}

export type Category = 'All' | 'Couple' | 'Kids' | 'Men' | 'Women' | 'Animals' | 'Landscape';
