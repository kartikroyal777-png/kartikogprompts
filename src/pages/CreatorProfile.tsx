import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Prompt, CreatorProfile as ICreatorProfile } from '../types';
import { Instagram, Globe, Youtube, CheckCircle, Lock, Unlock, Loader2, Sparkles } from 'lucide-react';
import PromptCard from '../components/PromptCard';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';

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
            .map((img: any) => {
                if (img.storage_path.startsWith('http')) return img.storage_path;
                return supabase.storage.from('prompt-images').getPublicUrl(img.storage_path).data.publicUrl;
            });

        return {
          id: p.id,
          short_id: p.short_id,
          promptId: p.short_id ? p.short_id.toString() : p.id.substring(0, 5),
          title: p.title,
          description: p.description,
          author: profileData.display_name,
          category: p.category,
          likes: p.likes_count || 0,
          image: imagesList[0] || p.image || 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x800?text=No+Image',
          images: imagesList,
          monetization_url: p.monetization_url,
          is_paid: p.is_paid,
          price_credits: p.price_credits
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

  if (loading) return <div className="min-h-screen pt-28 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (!creator) return <div className="min-h-screen pt-28 text-center">Creator not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-28 pb-12 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-800 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          
          <div className="relative flex flex-col md:flex-row gap-8 items-start">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl font-bold text-white shadow-xl flex-shrink-0 overflow-hidden">
              {creator.avatar_url ? (
                <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover" />
              ) : (
                creator.display_name[0].toUpperCase()
              )}
            </div>
            
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {creator.display_name}
                    <CheckCircle className="w-6 h-6 text-purple-500 fill-purple-500/10" />
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                    {creator.bio || "Digital Artist & Prompt Engineer"}
                  </p>
                </div>
                
                {/* Unlock Button */}
                {!isUnlocked ? (
                  <button
                    onClick={handleUnlock}
                    disabled={unlocking}
                    className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {unlocking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                    Unlock All for {creator.full_access_price_credits} Credits
                  </button>
                ) : (
                  <div className="px-6 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold rounded-xl border border-green-200 dark:border-green-800 flex items-center gap-2">
                    <Unlock className="w-5 h-5" />
                    Subscribed
                  </div>
                )}
              </div>

              {/* Socials & Stats */}
              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-gray-100 dark:border-slate-800">
                <div className="flex gap-3">
                  {creator.social_instagram && (
                    <a href={`https://instagram.com/${creator.social_instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full hover:text-pink-600 transition-colors">
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {creator.social_youtube && (
                    <a href={creator.social_youtube} target="_blank" rel="noreferrer" className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full hover:text-red-600 transition-colors">
                      <Youtube className="w-5 h-5" />
                    </a>
                  )}
                  {creator.website && (
                    <a href={creator.website} target="_blank" rel="noreferrer" className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full hover:text-sky-500 transition-colors">
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                </div>
                
                <div className="w-px h-8 bg-gray-200 dark:bg-slate-700 hidden sm:block" />
                
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block text-lg">{stats.prompts}</span>
                    <span className="text-slate-500 dark:text-slate-400">Prompts</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block text-lg">{stats.likes}</span>
                    <span className="text-slate-500 dark:text-slate-400">Likes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prompts Grid */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-sky-500" />
            Creator's Portfolio
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {prompts.map(prompt => (
              <PromptCard 
                key={prompt.id} 
                prompt={prompt} 
                onLikeToggle={handleLikeToggle}
              />
            ))}
            {prompts.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400">
                No prompts uploaded yet.
              </div>
            )}
          </div>
        </div>
      </div>
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
