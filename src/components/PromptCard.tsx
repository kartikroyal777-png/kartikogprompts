import React, { useState, useEffect } from 'react';
import { Heart, Instagram, Lock } from 'lucide-react';
import { Prompt } from '../types';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getIsLiked, toggleLike } from '../lib/likes';
import { cn } from '../lib/utils';
import ImageCarousel from './ImageCarousel';

interface PromptCardProps {
  prompt: Prompt;
  onLikeToggle?: (newIsLiked: boolean) => void;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onLikeToggle }) => {
  const navigate = useNavigate();
  const [likes, setLikes] = useState(prompt.likes);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    setIsLiked(getIsLiked(prompt.id));
    setLikes(prompt.likes); // Sync with prop updates
  }, [prompt.id, prompt.likes]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { newLikesCount, newIsLiked } = await toggleLike(prompt.id, likes, isLiked);
    setLikes(newLikesCount);
    setIsLiked(newIsLiked);
    
    if (onLikeToggle) {
      onLikeToggle(newIsLiked);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
    if (prompt.monetization_url) {
      window.open(prompt.monetization_url, '_blank');
    }
    navigate(`/prompt/${prompt.id}`);
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (prompt.creator_id) {
      navigate(`/creator/${prompt.creator_id}`);
    }
  };

  const imagesToDisplay = prompt.images && prompt.images.length > 0 
    ? prompt.images 
    : [prompt.image];

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      onClick={handleClick}
      className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      <div className="absolute inset-0 w-full h-full">
        <ImageCarousel images={imagesToDisplay} alt={prompt.title} />
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity pointer-events-none" />

      {/* Premium Badge */}
      {prompt.is_paid && (
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg border border-white/20">
            <Lock className="w-3 h-3" />
            {prompt.price_credits} Credits
          </div>
        </div>
      )}

      {/* Bundle Badge */}
      {prompt.images && prompt.images.length > 1 && (
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-purple-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg border border-white/20">
            <span className="text-xs">📚</span>
            Bundle
          </div>
        </div>
      )}

      <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
        <div className="flex justify-between items-start pointer-events-auto">
          <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
            <span className="text-[10px] font-bold text-white/90 tracking-wider">ID: {prompt.promptId}</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <motion.button 
              whileTap={{ scale: 0.8 }}
              className={cn(
                "p-2 rounded-full backdrop-blur-md transition-colors",
                isLiked ? "bg-red-500/20 text-red-500" : "bg-black/40 text-white hover:bg-white/20"
              )}
              onClick={handleLike}
            >
              <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
            </motion.button>
            <span className="text-xs font-bold text-white bg-black/40 backdrop-blur-md px-2 py-1.5 rounded-full min-w-[24px] text-center border border-white/10">
              {likes}
            </span>
          </div>
        </div>

        <div className="space-y-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <span className="inline-block px-3 py-1 bg-sky-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg shadow-sky-500/20">
            {prompt.category}
          </span>
          
          <div className="pointer-events-auto">
            <h3 className="text-lg font-bold text-white mb-1 line-clamp-1 leading-tight">{prompt.title}</h3>
            <div 
              className="flex items-center gap-1.5 text-gray-300 text-xs hover:text-white transition-colors w-fit"
              onClick={handleAuthorClick}
            >
              <span className="font-medium opacity-80">by {prompt.author}</span>
              <Instagram className="w-3 h-3 opacity-70" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PromptCard;
