import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, Share2, Copy, Check, Instagram, ArrowLeft, ExternalLink, Video, Lock, Unlock, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Prompt } from '../types';
import { getIsLiked, toggleLike } from '../lib/likes';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import ImageCarousel from '../components/ImageCarousel';
import { useAuth } from '../context/AuthContext';
import UnlockModal from '../components/UnlockModal';
import AuthModal from '../components/AuthModal';

const PromptDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, wallet, refreshProfile } = useAuth();
  
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [fullText, setFullText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [videoCopied, setVideoCopied] = useState(false);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  
  // Unlock States
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    if (id) fetchPromptDetail();
  }, [id, user]);

  const fetchPromptDetail = async () => {
    try {
      // 1. Fetch Public Prompt Data
      const { data: p, error } = await supabase
        .from('prompts')
        .select(`
          *,
          images:prompt_images(storage_path, order_index)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // 2. Check Unlock Status
      let unlocked = !p.is_paid; // Free prompts are unlocked by default
      
      if (user && p.is_paid) {
        // Check if user bought this prompt
        const { data: purchase } = await supabase
          .from('prompt_purchases')
          .select('id')
          .eq('user_id', user.id)
          .eq('prompt_id', id)
          .maybeSingle();
          
        if (purchase) unlocked = true;
        
        // Check if user has unlocked the creator
        if (!unlocked && p.creator_id) {
            const { data: creatorUnlock } = await supabase
                .from('creator_unlocks')
                .select('id')
                .eq('user_id', user.id)
                .eq('creator_id', p.creator_id)
                .maybeSingle();
            if (creatorUnlock) unlocked = true;
        }

        // Check if user is the creator
        if (p.creator_id === user.id) unlocked = true;
      }

      setIsUnlocked(unlocked);

      // 3. Fetch Full Text (if unlocked)
      let textContent = p.description; // Default to description (preview)
      
      if (unlocked) {
        const { data: content } = await supabase
          .from('prompt_contents')
          .select('full_text')
          .eq('prompt_id', id)
          .maybeSingle();
          
        if (content && content.full_text) {
          textContent = content.full_text;
        }
      }

      // Process images
      const imagesList = (p.images || [])
        .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
        .map((img: any) => {
          if (img.storage_path.startsWith('http')) return img.storage_path;
          return supabase.storage.from('prompt-images').getPublicUrl(img.storage_path).data.publicUrl;
        });

      let primaryImage = 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x800/1e293b/FFF?text=No+Image';
      if (imagesList.length > 0) primaryImage = imagesList[0];
      else if (p.image) primaryImage = p.image;

      const promptData: Prompt = {
        id: p.id,
        short_id: p.short_id,
        promptId: p.short_id ? p.short_id.toString() : p.id.substring(0, 5),
        title: p.title,
        description: p.description, // Preview text
        full_text: textContent,
        video_prompt: p.video_prompt,
        author: p.credit_name || 'Unknown',
        creator_id: p.creator_id,
        category: p.category,
        likes: p.likes_count || 0,
        image: primaryImage,
        images: imagesList,
        monetization_url: p.monetization_url,
        instagram_handle: p.instagram_handle,
        is_paid: p.is_paid,
        price_credits: p.price_credits
      };

      setPrompt(promptData);
      setFullText(textContent);
      setLikes(promptData.likes);
      setIsLiked(getIsLiked(promptData.id));
    } catch (error) {
      console.error('Error fetching prompt:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockClick = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowUnlockModal(true);
  };

  const confirmUnlock = async () => {
    if (!prompt || !user) return;
    setUnlocking(true);
    try {
      const { data, error } = await supabase.rpc('unlock_prompt', { p_prompt_id: prompt.id });
      if (error) throw error;
      
      await refreshProfile(); // Update wallet balance
      await fetchPromptDetail(); // Refresh prompt to get full text
      setShowUnlockModal(false);
      alert("Prompt unlocked successfully!");
    } catch (error: any) {
      console.error("Unlock failed", error);
      alert("Unlock failed: " + error.message);
    } finally {
      setUnlocking(false);
    }
  };

  const handleLike = async () => {
    if (!prompt) return;
    const { newLikesCount, newIsLiked } = await toggleLike(prompt.id, likes, isLiked);
    setLikes(newLikesCount);
    setIsLiked(newIsLiked);
  };

  const handleCopy = () => {
    if (!fullText) return;
    navigator.clipboard.writeText(fullText);
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
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-950 dark:text-white"><div className="animate-pulse">Loading...</div></div>;
  if (!prompt) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-950 dark:text-white">Prompt not found</div>;

  const imagesToDisplay = prompt.images && prompt.images.length > 0 ? prompt.images : [prompt.image];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pb-24 transition-colors duration-300">
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
            <ImageCarousel images={imagesToDisplay} alt={prompt.title} />
            
            {/* Locked Overlay on Image if Paid & Locked */}
            {!isUnlocked && prompt.is_paid && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center">
                  <Lock className="w-8 h-8 text-white mx-auto mb-2" />
                  <p className="text-white font-bold">Premium Preview</p>
                </div>
              </div>
            )}
          </motion.div>
          
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
              {prompt.is_paid && (
                <span className="px-4 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-bold rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Premium
                </span>
              )}
              <span className="text-slate-400 text-sm font-mono">ID: {prompt.promptId}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight">{prompt.title}</h1>
            
            <Link 
              to={prompt.creator_id ? `/creator/${prompt.creator_id}` : '#'}
              className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-sm font-bold">{prompt.author[0].toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Created by</div>
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  {prompt.author}
                  {prompt.creator_id && <Sparkles className="w-3 h-3 text-purple-500" />}
                </div>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded-full text-slate-400 group-hover:text-sky-500 transition-colors">
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </div>
            </Link>
          </div>

          {/* Prompt Box */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 relative group shadow-sm overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"/>
                Prompt
              </h3>
              {isUnlocked && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Text'}
                </button>
              )}
            </div>
            
            <div className="relative">
              <p className={cn(
                "text-slate-800 dark:text-slate-200 leading-relaxed text-lg whitespace-pre-wrap font-medium transition-all",
                !isUnlocked && "blur-md select-none opacity-50"
              )}>
                {fullText || "This prompt is locked. Unlock to view the full details."}
              </p>

              {/* Unlock Overlay */}
              {!isUnlocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
                  <Lock className="w-12 h-12 text-slate-400 mb-4" />
                  
                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button
                      onClick={handleUnlockClick}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Unlock className="w-5 h-5" />
                      Unlock for {prompt.price_credits} Credits
                    </button>
                    
                    {prompt.creator_id && (
                      <Link
                        to={`/creator/${prompt.creator_id}`}
                        className="px-6 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        Unlock All from Creator
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Video Prompt Box */}
          {prompt.video_prompt && isUnlocked && (
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

      <UnlockModal 
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onConfirm={confirmUnlock}
        title={prompt.title}
        cost={prompt.price_credits || 0}
        balance={wallet?.balance_credits || 0}
        loading={unlocking}
      />

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default PromptDetail;
