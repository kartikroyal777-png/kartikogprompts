import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Prompt, CreatorProfile as ICreatorProfile } from '../types';
import { Instagram, Globe, Youtube, CheckCircle, Lock, Unlock, Loader2, Sparkles, UserPlus } from 'lucide-react';
import PromptCard from '../components/PromptCard';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import { getImageUrl } from '../lib/utils';

interface ExtendedCreator extends ICreatorProfile {
  display_name: string;
  avatar_url?: string;
  creator_badge: boolean;
}

export default function CreatorProfile() {
  const { id } = useParams();
  const { user, wallet, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [creator, setCreator] = useState<ExtendedCreator | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [stats, setStats] = useState({ likes: 0, prompts: 0 });

  useEffect(() => {
    if (id) fetchCreatorData();
  }, [id, user]);

  const fetchCreatorData = async () => {
    try {
      // 1. Fetch Creator Details
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          creators (*)
        `)
        .eq('id', id)
        .single();

      if (profileError) throw profileError;
      if (!profileData.creators) throw new Error("This user is not a creator");

      const creatorData: ExtendedCreator = {
        ...profileData.creators,
        display_name: profileData.display_name,
        avatar_url: profileData.avatar_url,
        creator_badge: profileData.creator_badge
      };
      setCreator(creatorData);

      // 2. Check Unlock Status
      if (user) {
        if (user.id === id) {
          setIsUnlocked(true); // Creator owns their profile
        } else {
          const { data: unlock } = await supabase
            .from('creator_unlocks')
            .select('id')
            .eq('user_id', user.id)
            .eq('creator_id', id)
            .maybeSingle();
          setIsUnlocked(!!unlock);
        }
      }

      // 3. Fetch Prompts
      const { data: promptsData } = await supabase
        .from('prompts')
        .select(`
          *,
          images:prompt_images(storage_path, order_index)
        `)
        .eq('creator_id', id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      const formattedPrompts: Prompt[] = (promptsData || []).map((p: any) => {
         const imagesList = (p.images || [])
            .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
            .map((img: any) => getImageUrl(img.storage_path));

        let imageUrl = imagesList[0];
        if (!imageUrl) {
           imageUrl = getImageUrl(p.image);
        }

        return {
          id: p.id,
          short_id: p.short_id,
          promptId: p.short_id ? p.short_id.toString() : p.id.substring(0, 5),
          title: p.title,
          description: p.description,
          author: profileData.display_name,
          category: p.category,
          categories: p.categories || [p.category],
          likes: p.likes_count || 0,
          image: imageUrl,
          images: imagesList.length > 0 ? imagesList : [imageUrl],
          monetization_url: p.monetization_url,
          is_paid: p.is_paid,
          price_credits: p.price_credits,
          is_bundle: p.is_bundle
        };
      });

      setPrompts(formattedPrompts);
      setStats({
        likes: formattedPrompts.reduce((acc, curr) => acc + curr.likes, 0),
        prompts: formattedPrompts.length
      });

    } catch (error) {
      console.error("Error fetching creator:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    if (!creator) return;
    
    if ((wallet?.balance_credits || 0) < creator.full_access_price_credits) {
      if(confirm("Insufficient credits. Go to buy credits page?")) {
          navigate('/buy-credits');
      }
      return;
    }

    if (!confirm(`Unlock all prompts by ${creator.display_name} for ${creator.full_access_price_credits} credits?`)) return;

    setUnlocking(true);
    try {
      const { error } = await supabase.rpc('unlock_creator', { p_creator_id: creator.id });
      if (error) throw error;
      
      await refreshProfile();
      setIsUnlocked(true);
      alert(`Successfully subscribed to ${creator.display_name}!`);
    } catch (error: any) {
      alert("Unlock failed: " + error.message);
    } finally {
      setUnlocking(false);
    }
  };

  const handleLikeToggle = (newIsLiked: boolean) => {
    setStats(prev => ({
      ...prev,
      likes: newIsLiked ? prev.likes + 1 : Math.max(0, prev.likes - 1)
    }));
  };

  if (loading) return <div className="min-h-screen pt-28 flex justify-center dark:bg-slate-950"><Loader2 className="animate-spin text-sky-500" /></div>;
  if (!creator) return <div className="min-h-screen pt-28 text-center dark:bg-slate-950 dark:text-white">Creator not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-28 pb-12 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          
          <div className="relative flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
            {/* Avatar */}
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl md:text-4xl font-bold text-white shadow-xl flex-shrink-0 overflow-hidden ring-4 ring-white dark:ring-slate-800">
              {creator.avatar_url ? (
                <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover" />
              ) : (
                creator.display_name[0].toUpperCase()
              )}
            </div>
            
            <div className="flex-1 w-full text-center md:text-left">
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4 mb-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center md:justify-start gap-2">
                    {creator.display_name}
                    <CheckCircle className="w-6 h-6 text-purple-500 fill-purple-500/10" />
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl mx-auto md:mx-0">
                    {creator.bio || "Digital Artist & Prompt Engineer"}
                  </p>
                </div>
                
                {/* Unlock Button - Full width on mobile, auto on desktop */}
                {!isUnlocked ? (
                  <button
                    onClick={handleUnlock}
                    disabled={unlocking}
                    className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {unlocking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                    Unlock All ({creator.full_access_price_credits} Credits)
                  </button>
                ) : (
                  <div className="w-full md:w-auto px-6 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold rounded-xl border border-green-200 dark:border-green-800 flex items-center justify-center gap-2">
                    <Unlock className="w-5 h-5" />
                    Subscribed
                  </div>
                )}
              </div>

              {/* Stats & Socials Container */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-gray-100 dark:border-slate-800">
                
                {/* Stats */}
                <div className="flex gap-8 md:gap-12 w-full sm:w-auto justify-center sm:justify-start">
                  <div className="text-center md:text-left">
                    <span className="font-black text-2xl text-slate-900 dark:text-white block">{stats.prompts}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">Prompts</span>
                  </div>
                  <div className="text-center md:text-left">
                    <span className="font-black text-2xl text-slate-900 dark:text-white block">{stats.likes}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">Likes</span>
                  </div>
                </div>

                {/* Socials */}
                <div className="flex gap-3 w-full sm:w-auto justify-center sm:justify-end">
                  {creator.social_instagram && (
                    <a href={`https://instagram.com/${creator.social_instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-600 transition-all">
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {creator.social_youtube && (
                    <a href={creator.social_youtube} target="_blank" rel="noreferrer" className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all">
                      <Youtube className="w-5 h-5" />
                    </a>
                  )}
                  {creator.website && (
                    <a href={creator.website} target="_blank" rel="noreferrer" className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:text-sky-500 transition-all">
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prompts Grid - Updated for Mobile 2x3 (gap-2) */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-sky-500" />
            Creator's Portfolio
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">
            {prompts.map(prompt => (
              <PromptCard 
                key={prompt.id} 
                prompt={prompt} 
                onLikeToggle={handleLikeToggle}
              />
            ))}
            {prompts.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 dark:text-slate-400">No prompts uploaded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
