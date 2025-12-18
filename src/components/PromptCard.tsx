import React, { useState, useEffect } from 'react';
import { Heart, Instagram, Lock, Layers } from 'lucide-react';
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
      className="group relative aspect-[4/5] rounded-xl md:rounded-2xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      <div className="absolute inset-0 w-full h-full">
        <ImageCarousel images={imagesToDisplay} alt={prompt.title} />
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity pointer-events-none" />

      {/* Badges Container - Top Left - Mobile Optimized */}
      <div className="absolute top-2 left-2 md:top-3 md:left-3 z-20 flex flex-col gap-1.5 items-start pointer-events-none">
        {/* Premium Badge */}
        {prompt.is_paid && (
          <div className="bg-amber-500/90 backdrop-blur-md text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-full flex items-center gap-1 shadow-lg border border-white/20">
            <Lock className="w-2.5 h-2.5 md:w-3 md:h-3" />
            {prompt.price_credits} Cr
          </div>
        )}

        {/* Bundle Badge */}
        {prompt.images && prompt.images.length > 1 && (
          <div className="bg-purple-500/90 backdrop-blur-md text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-full flex items-center gap-1 shadow-lg border border-white/20">
            <Layers className="w-2.5 h-2.5 md:w-3 md:h-3" />
            Bundle
          </div>
        )}
      </div>

      {/* ID Badge - Bottom Right - Mobile Optimized */}
      <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 z-20 pointer-events-none">
         <div className="bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] md:text-[10px] font-mono font-medium text-white/80 border border-white/10">
            #{prompt.promptId}
          </div>
      </div>

      {/* Footer Content - Tighter padding for mobile */}
      <div className="absolute inset-0 p-2 md:p-4 flex flex-col justify-between pointer-events-none">
        <div className="flex justify-end items-start pointer-events-auto">
          {/* Like Button */}
          <div className="flex items-center gap-1">
            <motion.button 
              whileTap={{ scale: 0.8 }}
              className={cn(
                "p-1.5 md:p-2 rounded-full backdrop-blur-md transition-colors",
                isLiked ? "bg-red-500/20 text-red-500" : "bg-black/40 text-white hover:bg-white/20"
              )}
              onClick={handleLike}
            >
              <Heart className={cn("w-3.5 h-3.5 md:w-4 md:h-4", isLiked && "fill-current")} />
            </motion.button>
            <span className="text-[10px] md:text-xs font-bold text-white bg-black/40 backdrop-blur-md px-1.5 py-1 md:px-2 md:py-1.5 rounded-full min-w-[20px] md:min-w-[24px] text-center border border-white/10">
              {likes}
            </span>
          </div>
        </div>

        <div className="space-y-0.5 md:space-y-1 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <span className="inline-block px-1.5 py-0.5 bg-sky-500/90 backdrop-blur-sm text-white text-[8px] md:text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg shadow-sky-500/20">
            {prompt.category}
          </span>
          
          <div className="pointer-events-auto pr-8 md:pr-12"> 
            <h3 className="text-xs md:text-lg font-bold text-white mb-0.5 line-clamp-1 leading-tight">{prompt.title}</h3>
            <div 
              className="flex items-center gap-1 text-gray-300 text-[10px] md:text-xs hover:text-white transition-colors w-fit"
              onClick={handleAuthorClick}
            >
              <span className="font-medium opacity-80 truncate max-w-[100px] md:max-w-none">by {prompt.author}</span>
              <Instagram className="w-2.5 h-2.5 md:w-3 md:h-3 opacity-70" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PromptCard;
