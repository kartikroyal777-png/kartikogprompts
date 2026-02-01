import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, LogOut, Wallet, User, Heart, Image as ImageIcon, DollarSign, RefreshCw, CreditCard, Sparkles, Camera, Loader2, Star, Link as LinkIcon, Sun, Moon, Upload, Crown, Copy, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import PayoutModal from '../components/PayoutModal';
import UserListModal from '../components/UserListModal';
import { Subscriber, EarningEntry, Prompt } from '../types';
import PromptCard from '../components/PromptCard';
import { getImageUrl } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

// Native image compression to avoid WebContainer/Worker issues with browser-image-compression
const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      const MAX_WIDTH = 500;
      const MAX_HEIGHT = 500;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            }));
          } else {
            reject(new Error('Canvas to Blob failed'));
          }
        },
        'image/jpeg',
        0.7
      );
    };
    img.onerror = (error) => reject(error);
  });
};

const Profile = () => {
  const { user, profile, wallet, refreshProfile, signOut, isPro } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'prompts' | 'favorites' | 'settings'>('prompts');
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  
  // Stats & Lists
  const [totalLikes, setTotalLikes] = useState(0);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [earnings, setEarnings] = useState<EarningEntry[]>([]);
  
  // Prompts
  const [myPrompts, setMyPrompts] = useState<Prompt[]>([]);
  const [favoritePrompts, setFavoritePrompts] = useState<Prompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  
  // Modals
  const [showSubscribersModal, setShowSubscribersModal] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);

  // Edit Profile
  const [displayName, setDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Affiliate
  const [affiliateCopied, setAffiliateCopied] = useState(false);

  const isAdmin = user?.email === 'kartikroyal777@gmail.com';

  useEffect(() => {
    if (profile) {
      setDisplayName(isAdmin ? 'Admin' : (profile.full_name || ''));
      if (profile.role === 'creator' || isAdmin || (wallet?.withdrawable_credits ?? 0) > 0) {
        fetchCreatorStats();
      }
      fetchMyPrompts();
      fetchFavorites();
    }
  }, [profile, user, wallet]);

  const fetchMyPrompts = async () => {
    if (!user) return;
    setLoadingPrompts(true);
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select(`*, images:prompt_images(storage_path, order_index)`)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPrompts: Prompt[] = (data || []).map((p: any) => {
         const imagesList = (p.images || []).map((img: any) => getImageUrl(img.storage_path));
        let imageUrl = imagesList[0] || getImageUrl(p.image);

        return {
          id: p.id,
          short_id: p.short_id,
          promptId: p.short_id ? p.short_id.toString() : p.id.substring(0, 5),
          title: p.title,
          description: p.description,
          author: profile?.display_name || (isAdmin ? 'Admin' : 'Me'),
          category: p.category,
          likes: p.likes_count || 0,
          image: imageUrl,
          images: imagesList.length > 0 ? imagesList : [imageUrl],
          monetization_url: p.monetization_url,
          is_paid: p.is_paid,
          price_credits: p.price_credits,
          is_bundle: p.is_bundle,
          prompt_type: p.prompt_type,
          categories: p.categories || [p.category]
        };
      });

      setMyPrompts(formattedPrompts);
      const likes = formattedPrompts.reduce((sum, p) => sum + (p.likes || 0), 0);
      setTotalLikes(likes);

    } catch (error) {
      console.error("Error fetching prompts", error);
    } finally {
      setLoadingPrompts(false);
    }
  };

  const fetchFavorites = async () => {
      try {
          const likedIds = JSON.parse(localStorage.getItem('liked_prompts') || '[]');
          if (likedIds.length === 0) {
              setFavoritePrompts([]);
              return;
          }
          
          const { data, error } = await supabase
            .from('prompts')
            .select(`*, images:prompt_images(storage_path, order_index)`)
            .in('id', likedIds);
            
          if (error) throw error;
          
          const formatted = (data || []).map((p: any) => {
             const imagesList = (p.images || []).map((img: any) => getImageUrl(img.storage_path));
             let imageUrl = imagesList[0] || getImageUrl(p.image);
             return {
                 ...p,
                 image: imageUrl,
                 images: imagesList.length > 0 ? imagesList : [imageUrl],
                 author: p.credit_name || 'Admin',
                 promptId: p.short_id ? p.short_id.toString() : p.id.substring(0, 5),
                 categories: p.categories || [p.category]
             };
          });
          setFavoritePrompts(formatted);
      } catch (e) {
          console.error("Error fetching favorites", e);
      }
  };

  const fetchCreatorStats = async () => {
    if (!user) return;
    try {
      const { data: subs, error: subError } = await supabase.rpc('get_subscribers', { p_creator_id: user.id });
      if (!subError) setSubscribers(subs || []);

      const { data: earns, error: earnError } = await supabase.rpc('get_earnings_history', { p_creator_id: user.id });
      if (!earnError) setEarnings(earns || []);

    } catch (error) {
      console.error("Error fetching stats", error);
    }
  };

  if (!user || !profile) return null;

  const totalCredits = wallet?.balance_credits ?? 0;
  const earnedCredits = wallet?.withdrawable_credits ?? 0;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const handleConvertCredits = async () => {
    // Updated Logic: 2 Credits = $1
    if (earnedCredits < 2) {
      toast.error('Minimum 2 earned credits required to convert');
      return;
    }

    try {
      setConverting(true);
      const { error } = await supabase.rpc('convert_credits_to_usd', { credits_amount: 2 });
      if (error) throw error;
      await refreshProfile();
      toast.success('Successfully converted 2 credits to $1 USD');
    } catch (error) {
      console.error('Error converting credits:', error);
      toast.error('Failed to convert credits');
    } finally {
      setConverting(false);
    }
  };

  const handleSaveProfile = async () => {
    if (isAdmin) {
      toast.error("Admin name cannot be changed.");
      return;
    }
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: displayName })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
      toast.success("Profile updated!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Max 5MB.");
      return;
    }

    setUploadingAvatar(true);

    try {
      // Use native compression instead of library
      const compressedFile = await compressImage(file);
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('prompt-images')
        .upload(fileName, compressedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('prompt-images')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success("Profile photo updated!");
    } catch (error: any) {
      console.error("Avatar upload failed", error);
      toast.error("Failed to update photo: " + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const affiliateLink = `${window.location.origin}/pricing?ref=${user.id}`;

  const copyAffiliateLink = () => {
      navigator.clipboard.writeText(affiliateLink);
      setAffiliateCopied(true);
      setTimeout(() => setAffiliateCopied(false), 2000);
      toast.success("Affiliate Link Copied!");
  };

  const showCreatorTools = profile.role === 'creator' || isAdmin || earnedCredits > 0;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white pt-24 pb-12 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Header */}
        <div className="bg-slate-50 dark:bg-gray-900 rounded-3xl p-6 md:p-8 mb-12 border border-slate-200 dark:border-gray-800 shadow-sm relative">
          
          {/* Mobile Theme Toggle */}
          <div className="absolute top-4 right-4 md:hidden">
             <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-white dark:bg-black border border-gray-200 dark:border-gray-700 text-black dark:text-white"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            {/* Avatar Section */}
            <div className="relative group">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-black dark:bg-white flex items-center justify-center text-3xl md:text-4xl font-bold text-white dark:text-black shadow-lg overflow-hidden ring-4 ring-white dark:ring-gray-800">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name || ''} className="w-full h-full object-cover" />
                ) : (
                  (isAdmin ? 'A' : (profile.full_name?.[0] || user.email?.[0] || '?')).toUpperCase()
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-black dark:bg-white text-white dark:text-black rounded-full cursor-pointer shadow-lg hover:opacity-90 transition-all active:scale-95 border border-gray-200 dark:border-gray-800 z-20">
                <Camera className="w-4 h-4 md:w-5 md:h-5" />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-4 w-full">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 flex items-center justify-center md:justify-start gap-2">
                  {isAdmin ? 'Admin' : (profile.full_name || 'User')}
                  {profile.creator_badge && <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-black dark:text-white" />}
                  {isPro && <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] md:text-xs rounded-full font-bold">PRO</span>}
                </h1>
                <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium">{user.email}</p>
              </div>
              
              {/* Action Buttons Row */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3 w-full md:w-auto">
                  {/* Upload Button (For Everyone) */}
                  <Link 
                    to="/upload" 
                    className="flex items-center justify-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-all shadow-md text-xs md:text-sm flex-1 md:flex-none min-w-[120px] md:min-w-0"
                  >
                      <Upload className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      Upload Prompt
                  </Link>

                  {/* Upgrade Button (Non-Pro) */}
                  {!isPro && (
                      <Link 
                        to="/pricing" 
                        className="flex items-center justify-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:brightness-110 transition-all shadow-md text-xs md:text-sm flex-1 md:flex-none min-w-[120px] md:min-w-0"
                      >
                          <Crown className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          Upgrade to Pro
                      </Link>
                  )}
              </div>

              {/* Wallet Stats */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-4 pt-2 w-full md:w-auto">
                {showCreatorTools && (
                  <>
                    <button 
                      onClick={() => setShowEarningsModal(true)}
                      className="bg-white dark:bg-black px-3 py-2 md:px-5 md:py-3 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm hover:border-black dark:hover:border-white transition-colors group text-left flex-1 md:flex-none min-w-[100px]"
                    >
                      <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-black dark:group-hover:text-white">Earned Credits</div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-black dark:text-white" />
                        <span className="font-bold text-sm md:text-lg text-slate-900 dark:text-white">{earnedCredits}</span>
                      </div>
                    </button>

                    <div className="bg-white dark:bg-black px-3 py-2 md:px-5 md:py-3 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex-1 md:flex-none min-w-[100px]">
                      <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">USD Wallet</div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-black dark:text-white" />
                        <span className="font-bold text-sm md:text-lg text-slate-900 dark:text-white">{profile.usd_balance || 0}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Creator Actions */}
              {showCreatorTools && (
                <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-start pt-2 w-full md:w-auto">
                  <button
                    onClick={handleConvertCredits}
                    disabled={earnedCredits < 2 || converting}
                    className="bg-black dark:bg-white hover:opacity-80 text-white dark:text-black px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex-1 md:flex-none min-w-[140px]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 ${converting ? 'animate-spin' : ''}`} />
                    Convert 2 Cr to $1
                  </button>
                  
                  <button
                    onClick={() => setIsPayoutModalOpen(true)}
                    className="bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-black dark:text-white px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 flex-1 md:flex-none min-w-[120px]"
                  >
                    <DollarSign className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    Withdraw
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 w-full md:w-auto md:min-w-[160px] mt-4 md:mt-0">
              <button onClick={handleSignOut} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-gray-700 px-4 py-2 md:px-6 md:py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-xs md:text-sm w-full">
                <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Sign Out
              </button>
            </div>
          </div>
          
          {/* Affiliate Link Section (Full Width) */}
          {profile.creator_badge && (
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-gray-800">
                  <h3 className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <LinkIcon className="w-3.5 h-3.5 md:w-4 md:h-4" /> Your Affiliate Link
                  </h3>
                  <div className="flex items-center gap-2 bg-white dark:bg-black p-2 rounded-xl border border-slate-200 dark:border-gray-800">
                      <input 
                          type="text" 
                          readOnly 
                          value={affiliateLink}
                          className="flex-1 bg-transparent px-3 text-xs md:text-sm font-mono text-slate-600 dark:text-slate-300 outline-none truncate"
                      />
                      <button 
                          onClick={copyAffiliateLink}
                          className="px-3 py-1.5 md:px-4 md:py-2 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-black dark:text-white rounded-lg text-[10px] md:text-xs font-bold transition-colors flex items-center gap-2"
                      >
                          {affiliateCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {affiliateCopied ? 'Copied' : 'Copy'}
                      </button>
                  </div>
                  <p className="text-[10px] md:text-xs text-slate-400 mt-2">Share this link. When users upgrade to Pro, you earn 10 credits.</p>
              </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-gray-800 mb-8 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('prompts')}
            className={`px-6 md:px-8 py-3 md:py-4 font-bold text-xs md:text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'prompts' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
            My Prompts
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-6 md:px-8 py-3 md:py-4 font-bold text-xs md:text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'favorites' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Star className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Favorites
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 md:px-8 py-3 md:py-4 font-bold text-xs md:text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'settings' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Settings
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {activeTab === 'prompts' && (
            <>
              {loadingPrompts ? (
                <div className="text-center py-12 text-slate-400">Loading prompts...</div>
              ) : myPrompts.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">
                  {myPrompts.map(prompt => (
                    <PromptCard key={prompt.id} prompt={prompt} />
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-16 bg-slate-50 dark:bg-gray-900 rounded-3xl border border-slate-100 dark:border-gray-800">
                  <ImageIcon className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <p className="text-base md:text-lg font-medium text-slate-600 dark:text-slate-400">You haven't uploaded any prompts yet.</p>
                  <Link to="/upload" className="text-black dark:text-white hover:underline font-bold mt-2 inline-block text-sm md:text-base">
                    Upload your first prompt
                  </Link>
                </div>
              )}
            </>
          )}

          {activeTab === 'favorites' && (
            <>
              {favoritePrompts.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">
                  {favoritePrompts.map(prompt => (
                    <PromptCard key={prompt.id} prompt={prompt} />
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-16 bg-slate-50 dark:bg-gray-900 rounded-3xl border border-slate-100 dark:border-gray-800">
                  <Star className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <p className="text-base md:text-lg font-medium text-slate-600 dark:text-slate-400">No favorites yet.</p>
                  <Link to="/prompts" className="text-black dark:text-white hover:underline font-bold mt-2 inline-block text-sm md:text-base">
                    Browse prompts
                  </Link>
                </div>
              )}
            </>
          )}
          
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-gray-800 shadow-sm max-w-2xl">
              <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-6">Account Settings</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">Email Address</label>
                  <input type="text" value={user.email} disabled className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium text-sm md:text-base" />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isAdmin}
                    className="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-medium disabled:bg-slate-50 disabled:text-slate-500 text-sm md:text-base" 
                  />
                  {isAdmin && <p className="text-xs text-red-500 mt-1">Admin name cannot be changed.</p>}
                </div>
                <button 
                  onClick={handleSaveProfile}
                  disabled={savingProfile || isAdmin}
                  className="bg-black dark:bg-white text-white dark:text-black px-6 md:px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 text-sm md:text-base w-full md:w-auto"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <PayoutModal 
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        availableUsd={profile.usd_balance || 0}
        onSuccess={refreshProfile}
      />

      <UserListModal 
        isOpen={showSubscribersModal}
        onClose={() => setShowSubscribersModal(false)}
        title="Subscribers"
        type="subscribers"
        subscribers={subscribers}
      />

      <UserListModal 
        isOpen={showEarningsModal}
        onClose={() => setShowEarningsModal(false)}
        title="Earnings History"
        type="earnings"
        earnings={earnings}
      />
    </div>
  );
};

export default Profile;
