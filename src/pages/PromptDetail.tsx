import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Share2, Copy, Check, Instagram, ArrowLeft, ExternalLink, Video } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Prompt } from '../types';
import { getIsLiked, toggleLike } from '../lib/likes';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const PromptDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [videoCopied, setVideoCopied] = useState(false);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (id) fetchPromptDetail();
  }, [id]);

  const fetchPromptDetail = async () => {
    try {
      const { data: p, error } = await supabase
        .from('prompts')
        .select(`
          id,
          title,
          description,
          video_prompt,
          category,
          likes_count,
          monetization_url,
          credit_name,
          instagram_handle,
          images:prompt_images(storage_path)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const imagePath = p.images?.[0]?.storage_path;
      let imageUrl = 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x400?text=No+Image';
      
      if (imagePath) {
         if (imagePath.startsWith('http')) {
             imageUrl = imagePath;
         } else {
             imageUrl = supabase.storage.from('prompt-images').getPublicUrl(imagePath).data.publicUrl;
         }
      }

      const promptData = {
        id: p.id,
        promptId: p.id.substring(0, 5),
        title: p.title,
        description: p.description,
        video_prompt: p.video_prompt,
        author: p.credit_name || 'Unknown',
        category: p.category,
        likes: p.likes_count || 0,
        image: imageUrl,
        monetization_url: p.monetization_url,
        instagram_handle: p.instagram_handle
      };

      setPrompt(promptData);
      setLikes(promptData.likes);
      setIsLiked(getIsLiked(promptData.id));
    } catch (error) {
      console.error('Error fetching prompt:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!prompt) return;
    const { newLikesCount, newIsLiked } = await toggleLike(prompt.id, likes, isLiked);
    setLikes(newLikesCount);
    setIsLiked(newIsLiked);
  };

  const handleCopy = () => {
    if (!prompt?.description) return;
    navigator.clipboard.writeText(prompt.description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVideoCopy = () => {
    if (!prompt?.video_prompt) return;
    navigator.clipboard.writeText(prompt.video_prompt);
    setVideoCopied(true);
    setTimeout(() => setVideoCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: prompt?.title || 'OGPrompts',
          text: `Check out this AI prompt: ${prompt?.title}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      // Fallback
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-950 dark:text-white"><div className="animate-pulse">Loading...</div></div>;
  if (!prompt) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-950 dark:text-white">Prompt not found</div>;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pb-24 transition-colors duration-300">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 pt-28">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Prompts
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: Image */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-gray-100 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 relative group"
          >
            <img 
              src={prompt.image} 
              alt={prompt.title} 
              className="w-full h-full object-cover"
            />
            {/* Zoom hint */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
          </motion.div>
          
          {/* Action Buttons */}
          <div className="flex gap-4">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleLike}
              className={cn(
                "flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm",
                isLiked 
                  ? "bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-100 dark:border-red-900/30" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
              {likes} Likes
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Share2 className="w-5 h-5" />
              Share
            </motion.button>
          </div>
        </div>

        {/* Right: Details */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="px-4 py-1.5 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 text-sm font-bold rounded-full border border-sky-200 dark:border-sky-800">
                {prompt.category}
              </span>
              <span className="text-slate-400 text-sm font-mono">ID: {prompt.promptId}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight">{prompt.title}</h1>
            
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                <span className="text-sm font-bold">{prompt.author[0].toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Created by</div>
                <div className="font-bold text-slate-900 dark:text-white">{prompt.author}</div>
              </div>
              {prompt.instagram_handle && (
                <a 
                  href={prompt.instagram_handle.startsWith('http') ? prompt.instagram_handle : `https://instagram.com/${prompt.instagram_handle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white dark:bg-slate-800 rounded-full text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Prompt Box */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 relative group shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"/>
                Prompt
              </h3>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
            </div>
            
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-lg whitespace-pre-wrap font-medium">
              {prompt.description}
            </p>
          </div>

          {/* Video Prompt Box (Conditional) */}
          {prompt.video_prompt && (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 relative group shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-500" />
                  Video Prompt
                </h3>
                <button
                  onClick={handleVideoCopy}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-purple-500 dark:hover:text-purple-400 transition-colors"
                >
                  {videoCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {videoCopied ? 'Copied!' : 'Copy Text'}
                </button>
              </div>
              
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-lg whitespace-pre-wrap font-medium">
                {prompt.video_prompt}
              </p>
            </div>
          )}

          {/* Monetization / External Link */}
          {prompt.monetization_url && (
            <a 
              href={prompt.monetization_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-6 bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl shadow-lg shadow-sky-500/20 group hover:shadow-sky-500/30 transition-all transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between text-white">
                <div>
                  <h4 className="font-bold text-lg mb-1">Get Full Resource / Support Creator</h4>
                  <p className="text-sky-100 text-sm">Visit the creator's link for more details</p>
                </div>
                <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
                  <ExternalLink className="w-6 h-6" />
                </div>
              </div>
            </a>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PromptDetail;
