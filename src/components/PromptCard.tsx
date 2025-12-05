import React, { useState, useEffect } from 'react';
import { Heart, Instagram } from 'lucide-react';
import { Prompt } from '../types';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getIsLiked, toggleLike } from '../lib/likes';
import { cn } from '../lib/utils';

interface PromptCardProps {
  prompt: Prompt;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt }) => {
  const navigate = useNavigate();
  const [likes, setLikes] = useState(prompt.likes);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    setIsLiked(getIsLiked(prompt.id));
  }, [prompt.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { newLikesCount, newIsLiked } = await toggleLike(prompt.id, likes, isLiked);
    setLikes(newLikesCount);
    setIsLiked(newIsLiked);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking the heart button
    if ((e.target as HTMLElement).closest('button')) return;

    // Monetization Logic: Open link in new tab if exists
    if (prompt.monetization_url) {
      window.open(prompt.monetization_url, '_blank');
    }
    
    // Navigate to detail page
    navigate(`/prompt/${prompt.id}`);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      onClick={handleClick}
      className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      {/* Background Image */}
      <img 
        src={prompt.image} 
        alt={prompt.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

      {/* Content Container */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between">
        
        {/* Top Row */}
        <div className="flex justify-between items-start">
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

        {/* Bottom Row */}
        <div className="space-y-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <span className="inline-block px-3 py-1 bg-sky-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg shadow-sky-500/20">
            {prompt.category}
          </span>
          
          <div>
            <h3 className="text-lg font-bold text-white mb-1 line-clamp-1 leading-tight">{prompt.title}</h3>
            <div className="flex items-center gap-1.5 text-gray-300 text-xs">
              <span className="font-medium opacity-80">by {prompt.author}</span>
              {/* Only show instagram icon if we assume author has one, purely visual here */}
              <Instagram className="w-3 h-3 opacity-70" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PromptCard;
