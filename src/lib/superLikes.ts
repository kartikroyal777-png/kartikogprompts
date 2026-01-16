import { supabase } from './supabase';

export const getIsSuperLiked = (promptId: string): boolean => {
  try {
    const likedPrompts = JSON.parse(localStorage.getItem('liked_super_prompts') || '[]');
    return likedPrompts.includes(promptId);
  } catch {
    return false;
  }
};

export const toggleSuperLike = async (promptId: string, currentLikes: number, isLiked: boolean) => {
  const newIsLiked = !isLiked;
  const newLikesCount = newIsLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);

  // Update Local Storage
  try {
    const likedPrompts = JSON.parse(localStorage.getItem('liked_super_prompts') || '[]');
    if (newIsLiked) {
      if (!likedPrompts.includes(promptId)) {
        localStorage.setItem('liked_super_prompts', JSON.stringify([...likedPrompts, promptId]));
      }
    } else {
      localStorage.setItem('liked_super_prompts', JSON.stringify(likedPrompts.filter((id: string) => id !== promptId)));
    }
  } catch (e) {
    console.error("Error updating local storage", e);
  }

  // Update Server (Fire and forget)
  const rpcName = newIsLiked ? 'increment_super_prompt_likes' : 'decrement_super_prompt_likes';
  supabase.rpc(rpcName, { p_prompt_id: promptId }).then(({ error }) => {
    if (error) console.error(`Error calling ${rpcName}:`, error);
  });

  return { newLikesCount, newIsLiked };
};
