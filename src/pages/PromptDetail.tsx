import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, Share2, Copy, Check, Instagram, ArrowLeft, ExternalLink, Video, Lock, Unlock, Sparkles, Layers, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Prompt } from '../types';
import { getIsLiked, toggleLike } from '../lib/likes';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import ImageCarousel from '../components/ImageCarousel';
import { useAuth } from '../context/AuthContext';
import UnlockModal from '../components/UnlockModal';
import AuthModal from '../components/AuthModal';
import ShareModal from '../components/ShareModal';
import toast from 'react-hot-toast';
import { getImageUrl } from '../lib/utils';

interface BundleItem {
  index: number;
  text: string;
}

const PromptDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, wallet, refreshProfile } = useAuth();
  
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [fullText, setFullText] = useState<string | null>(null);
  const [bundleData, setBundleData] = useState<BundleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [videoCopied, setVideoCopied] = useState(false);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  
  // Unlock States
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  // Share State
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (id) fetchPromptDetail();
  }, [id, user]);

  const fetchPromptDetail = async () => {
    try {
      const { data: p, error } = await supabase
        .from('prompts')
        .select(`*, images:prompt_images(storage_path, order_index)`)
        .eq('id', id)
        .single();

      if (error) throw error;

      let unlocked = !p.is_paid;
      
      if (user && p.is_paid) {
        const { data: purchase } = await supabase
          .from('prompt_purchases')
          .select('id')
          .eq('user_id', user.id)
          .eq('prompt_id', id)
          .maybeSingle();
          
        if (purchase) unlocked = true;
        
        if (!unlocked && p.creator_id) {
            const { data: creatorUnlock } = await supabase
                .from('creator_unlocks')
                .select('id')
                .eq('user_id', user.id)
                .eq('creator_id', p.creator_id)
                .maybeSingle();
            if (creatorUnlock) unlocked = true;
        }

        if (p.creator_id === user.id) unlocked = true;
      }

      setIsUnlocked(unlocked);

      let textContent = p.description;
      let bundleContent: BundleItem[] = [];
      
      if (unlocked) {
        const { data: content } = await supabase
          .from('prompt_contents')
          .select('full_text, bundle_data')
          .eq('prompt_id', id)
          .maybeSingle();
          
        if (content) {
          if (content.full_text) textContent = content.full_text;
          if (content.bundle_data) bundleContent = content.bundle_data;
        }
      }

      const imagesList = (p.images || [])
        .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
        .map((img: any) => getImageUrl(img.storage_path));

      let primaryImage = imagesList[0];
      if (!primaryImage) {
         primaryImage = getImageUrl(p.image);
      }

      const promptData: Prompt = {
        id: p.id,
        short_id: p.short_id,
        promptId: p.short_id ? p.short_id.toString() : p.id.substring(0, 5),
        title: p.title,
        description: p.description,
        full_text: textContent,
        video_prompt: p.video_prompt,
        author: p.credit_name || 'Unknown',
        creator_id: p.creator_id,
        category: p.category,
        categories: p.categories || [p.category],
        likes: p.likes_count || 0,
        image: primaryImage,
        images: imagesList.length > 0 ? imagesList : [primaryImage],
        monetization_url: p.monetization_url,
        instagram_handle: p.instagram_handle,
        is_paid: p.is_paid,
        price_credits: p.price_credits,
        is_bundle: p.is_bundle,
        prompt_type: p.prompt_type
      };

      setPrompt(promptData);
      setFullText(textContent);
      setBundleData(bundleContent);
      setLikes(promptData.likes);
      setIsLiked(getIsLiked(promptData.id));
    } catch (error) {
      console.error('Error fetching prompt:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockClick = () => {
    // Redirect to pricing page for Pro membership
    navigate('/pricing');
  };

  const confirmUnlock = async () => {
    if (!prompt || !user) return;
    setUnlocking(true);
    try {
      const { data, error } = await supabase.rpc('unlock_prompt', { p_prompt_id: prompt.id });
      if (error) throw error;
      
      await refreshProfile();
      await fetchPromptDetail();
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

  const handleCopy = (text: string, index?: number) => {
    if (!text) {
        toast.error("Nothing to copy!");
        return;
    }
    
    const onSuccess = () => {
        if (index !== undefined) {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } else {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        toast.success("Copied to clipboard!");
    };

    // Try modern API first
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(onSuccess).catch(err => {
            console.error("Clipboard write failed", err);
            fallbackCopy(text, onSuccess);
        });
    } else {
        fallbackCopy(text, onSuccess);
    }
  };

  const fallbackCopy = (text: string, onSuccess: () => void) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Ensure it's not visible but part of the DOM
      textArea.style.opacity = "0";
      textArea.style.pointerEvents = "none";
      textArea.style.position = "fixed";
      textArea.style.left = "0";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      
      try {
          const successful = document.execCommand('copy');
          if (successful) onSuccess();
          else toast.error("Failed to copy");
      } catch (err) {
          console.error('Fallback copy failed', err);
          toast.error("Failed to copy");
      }
      
      document.body.removeChild(textArea);
  };

  const handleVideoCopy = () => {
    if (!prompt?.video_prompt) return;
    handleCopy(prompt.video_prompt);
    setVideoCopied(true);
    setTimeout(() => setVideoCopied(false), 2000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-black dark:text-white"><div className="animate-pulse">Loading...</div></div>;
  if (!prompt) return <div className="min-h-screen flex items-center justify-center dark:bg-black dark:text-white">Prompt not found</div>;

  const imagesToDisplay = prompt.images && prompt.images.length > 0 ? prompt.images : [prompt.image];

  return (
    <div className="min-h-screen bg-white dark:bg-black pb-24 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 pt-28">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors font-medium"
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
            className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-gray-100 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 relative group"
          >
            <ImageCarousel images={imagesToDisplay} alt={prompt.title} />
          </motion.div>
          
          <div className="flex gap-4">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleLike}
              className={cn(
                "flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm",
                isLiked 
                  ? "bg-black text-white dark:bg-white dark:text-black" 
                  : "bg-slate-100 dark:bg-gray-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-800"
              )}
            >
              <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
              {likes} Likes
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowShareModal(true)}
              className="flex-1 py-4 bg-slate-100 dark:bg-gray-900 hover:bg-slate-200 dark:hover:bg-gray-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm"
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
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {prompt.categories?.map((cat) => (
                <span key={cat} className="px-3 py-1 bg-gray-100 dark:bg-gray-900 text-black dark:text-white text-xs font-bold rounded-full border border-gray-200 dark:border-gray-800">
                  {cat}
                </span>
              ))}
              
              {prompt.is_paid && (
                <span className="px-3 py-1 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Premium
                </span>
              )}
              {prompt.is_bundle && (
                <span className="px-3 py-1 bg-gray-200 dark:bg-gray-800 text-black dark:text-white text-xs font-bold rounded-full flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  Bundle
                </span>
              )}
              <span className="text-slate-400 text-xs font-mono ml-auto">ID: {prompt.promptId}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight">{prompt.title}</h1>
            
            <Link 
              to={prompt.creator_id ? `/creator/${prompt.creator_id}` : '#'}
              className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors group"
            >
              <div className="w-10 h-10 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-sm font-bold">{prompt.author[0].toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Created by</div>
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  {prompt.author}
                  {prompt.creator_id && <Sparkles className="w-3 h-3 text-black dark:text-white" />}
                </div>
              </div>
              <div className="p-2 bg-white dark:bg-black rounded-full text-slate-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </div>
            </Link>
          </div>

          {/* Prompt Box */}
          <div className="bg-slate-50 dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 p-6 md:p-8 relative group shadow-sm overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 bg-black dark:bg-white rounded-full animate-pulse"/>
                {prompt.is_bundle ? 'Bundle Prompts' : 'Prompt'}
              </h3>
              {isUnlocked && !prompt.is_bundle && (
                <button
                  onClick={() => handleCopy(fullText || '')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-black border border-slate-200 dark:border-gray-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Text'}
                </button>
              )}
            </div>
            
            <div className="relative">
              {!isUnlocked ? (
                // Locked View
                <div className="relative">
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-lg whitespace-pre-wrap font-medium blur-md select-none opacity-50">
                    {fullText || "This prompt is locked. Unlock to view the full details."}
                  </p>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
                    <Lock className="w-12 h-12 text-slate-400 mb-4" />
                    
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                      <Link
                        to="/pricing"
                        className="px-6 py-3 bg-black dark:bg-white hover:opacity-80 text-white dark:text-black font-bold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Crown className="w-5 h-5" />
                        Unlock for Pro Member
                      </Link>
                      
                      {/* Removed Unlock All From Creator Button */}
                    </div>
                  </div>
                </div>
              ) : (
                // Unlocked View
                <div>
                  {prompt.is_bundle && bundleData.length > 0 ? (
                    <div className="space-y-6">
                      {bundleData.map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-black p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase">Image {idx + 1}</span>
                            <button
                              onClick={() => handleCopy(item.text, idx)}
                              className="text-xs flex items-center gap-1 text-black dark:text-white hover:underline"
                            >
                              {copiedIndex === idx ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              Copy
                            </button>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200 text-sm whitespace-pre-wrap">
                            {item.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-lg whitespace-pre-wrap font-medium">
                      {fullText}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Video Prompt Box */}
          {prompt.video_prompt && isUnlocked && (
            <div className="bg-slate-50 dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 p-6 md:p-8 relative group shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Video className="w-4 h-4 text-black dark:text-white" />
                  Video Prompt
                </h3>
                <button
                  onClick={handleVideoCopy}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-black border border-slate-200 dark:border-gray-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors"
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
              className="block p-6 bg-black dark:bg-white rounded-2xl shadow-lg group hover:opacity-90 transition-all transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between text-white dark:text-black">
                <div>
                  <h4 className="font-bold text-lg mb-1">Get Full Resource / Support Creator</h4>
                  <p className="text-gray-400 dark:text-gray-600 text-sm">Visit the creator's link for more details</p>
                </div>
                <div className="bg-white/20 dark:bg-black/10 p-2 rounded-full transition-colors">
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

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={prompt.title}
        url={window.location.href}
      />
    </div>
  );
};

export default PromptDetail;
