import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Sparkles, LogOut, Coins, Upload, Settings, CheckCircle, ExternalLink, Wallet, UserCheck, ArrowRight, Camera, Loader2, RefreshCw, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AuthModal from '../components/AuthModal';
import PayoutModal from '../components/PayoutModal';
import PromptCard from '../components/PromptCard';
import { Prompt } from '../types';

interface SubscribedCreator {
  id: string;
  creator_id: string;
  creator: {
    display_name: string;
    avatar_url?: string;
  };
}

export default function Profile() {
  const { user, profile, wallet, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [creatorStats, setCreatorStats] = useState({ 
    earnings: 0, 
    subscribers: 0,
    availableBalance: 0,
    usdBalance: 0
  });
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [subscriptions, setSubscriptions] = useState<SubscribedCreator[]>([]);
  const [myPrompts, setMyPrompts] = useState<Prompt[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAuthOpen(true);
    } else {
      if (profile?.creator_badge) {
        fetchCreatorStats();
        fetchMyPrompts();
      }
      fetchSubscriptions();
    }
  }, [user, profile]);

  const fetchCreatorStats = async () => {
    if (!user) return;
    try {
      // Fetch gross earnings
      const { data: earnings } = await supabase.from('creator_earnings').select('gross_credits').eq('creator_id', user.id);
      const totalEarnings = earnings?.reduce((acc, curr) => acc + (curr.gross_credits || 0), 0) || 0;

      // Fetch available credit balance
      let available = totalEarnings;
      try {
        const { data: balanceData, error } = await supabase.rpc('get_creator_payout_balance', { p_creator_id: user.id });
        if (!error && balanceData !== null) available = balanceData;
      } catch (e) { console.warn(e); }

      // Fetch USD Balance
      let usd = 0;
      try {
        const { data: creatorData } = await supabase.from('creators').select('usd_balance').eq('id', user.id).single();
        if (creatorData) usd = creatorData.usd_balance || 0;
      } catch (e) { console.warn(e); }

      const { count } = await supabase.from('creator_unlocks').select('*', { count: 'exact', head: true }).eq('creator_id', user.id);

      setCreatorStats({ 
        earnings: totalEarnings, 
        subscribers: count || 0,
        availableBalance: Number(available),
        usdBalance: Number(usd)
      });
    } catch (e) { console.error(e); }
  };

  const fetchSubscriptions = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('creator_unlocks')
        .select(`id, creator_id, creator:profiles!creator_unlocks_creator_id_fkey (display_name, avatar_url)`)
        .eq('user_id', user.id);
      setSubscriptions(data as any || []);
    } catch (error) { console.error(error); }
  };

  const fetchMyPrompts = async () => {
    if (!user) return;
    try {
      const { data: promptsData } = await supabase
        .from('prompts')
        .select(`*, images:prompt_images(storage_path, order_index)`)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      const formattedPrompts: Prompt[] = (promptsData || []).map((p: any) => {
         const imagesList = (p.images || []).sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
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
          author: profile?.display_name || 'Me',
          category: p.category,
          likes: p.likes_count || 0,
          image: imagesList[0] || p.image || 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x800?text=No+Image',
          images: imagesList,
          monetization_url: p.monetization_url,
          is_paid: p.is_paid,
          price_credits: p.price_credits
        };
      });
      setMyPrompts(formattedPrompts);
    } catch (error) { console.error(error); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    setUploadingAvatar(true);
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;

      await refreshProfile();
    } catch (error: any) {
      alert('Error uploading avatar: ' + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleConvertCredits = async () => {
    if (creatorStats.availableBalance < 15) {
      alert("Minimum 15 credits required for conversion.");
      return;
    }
    
    // Calculate max convertible (multiples of 15)
    const convertible = Math.floor(creatorStats.availableBalance / 15) * 15;
    const usdValue = (convertible / 15).toFixed(2);

    if (!confirm(`Convert ${convertible} credits to $${usdValue} USD?`)) return;

    setConverting(true);
    try {
      const { error } = await supabase.rpc('convert_credits_to_usd', { p_credits: convertible });
      if (error) throw error;
      
      await fetchCreatorStats();
      alert(`Successfully converted ${convertible} credits to $${usdValue}!`);
    } catch (error: any) {
      alert("Conversion failed: " + error.message);
    } finally {
      setConverting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <AuthModal isOpen={true} onClose={() => { navigate('/'); }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-28 pb-24 px-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Profile Header */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {uploadingAvatar ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center md:justify-start gap-2">
                {profile?.display_name || 'User'}
                {profile?.pro_badge && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-bold border border-amber-200 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> PRO</span>}
                {profile?.creator_badge && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-bold border border-purple-200 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> CREATOR</span>}
              </h1>
              <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
              
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                <Link to="/buy-credits" className="px-4 py-2 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-sky-100 transition-colors">
                  <Coins className="w-4 h-4" />
                  {wallet?.balance_credits || 0} Credits
                </Link>
                <button onClick={signOut} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-slate-200 transition-colors">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Creator Dashboard */}
        {profile?.creator_badge && (
          <>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Credit Balance */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Credit Earnings</h3>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{creatorStats.availableBalance} <span className="text-sm font-normal text-slate-400">Credits</span></div>
                
                <button 
                  onClick={handleConvertCredits}
                  disabled={converting || creatorStats.availableBalance < 15}
                  className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-50"
                >
                  {converting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Convert to USD
                </button>
                <p className="text-xs text-slate-400 mt-2 text-center">Rate: 15 Credits = $1.00</p>
              </div>

              {/* USD Balance */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">USD Wallet</h3>
                <div className="text-3xl font-bold text-green-600 dark:text-green-500 mb-4">${creatorStats.usdBalance.toFixed(2)}</div>
                
                <button 
                  onClick={() => setShowPayoutModal(true)}
                  className="w-full py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  Withdraw Funds
                </button>
                <p className="text-xs text-slate-400 mt-2 text-center">Min Withdrawal: $10.00</p>
              </div>

              {/* Actions */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 flex flex-col justify-center gap-3">
                <div className="mb-2">
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Subscribers</h3>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{creatorStats.subscribers}</div>
                </div>
                <Link to="/upload" className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                  <Upload className="w-4 h-4" />
                  Sell New Prompt
                </Link>
              </div>
            </div>

            {/* My Prompts Section */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                My Portfolio
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myPrompts.map(prompt => (
                  <PromptCard key={prompt.id} prompt={prompt} />
                ))}
                {myPrompts.length === 0 && (
                  <div className="col-span-full text-center py-8 text-slate-500">No prompts uploaded yet.</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Become Creator CTA */}
        {!profile?.creator_badge && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2">Become a Creator</h2>
              <p className="text-purple-100 mb-6 max-w-lg">
                Start selling your prompts today. Set your own prices, build a fanbase, and earn real money.
              </p>
              <Link 
                to="/become-creator"
                className="px-6 py-3 bg-white text-purple-600 rounded-xl font-bold shadow-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Start Creator Journey
              </Link>
            </div>
            <Sparkles className="absolute top-8 right-8 w-32 h-32 text-white/10" />
          </div>
        )}

        {/* My Subscriptions */}
        {subscriptions.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-sky-500" />
              My Subscriptions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subscriptions.map((sub) => (
                <Link 
                  key={sub.id} 
                  to={`/creator/${sub.creator_id}`}
                  className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                    {sub.creator.avatar_url ? (
                      <img src={sub.creator.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      sub.creator.display_name[0].toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white">{sub.creator.display_name}</h3>
                    <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Unlocked
                    </p>
                  </div>
                  <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded-full text-slate-400 group-hover:text-sky-500 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link to="/buy-credits" className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition-transform">
              <Coins className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">Buy Credits</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Top up your wallet to unlock premium prompts.</p>
          </Link>
          
          <Link to="/ebook" className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center text-sky-600 mb-4 group-hover:scale-110 transition-transform">
              <ExternalLink className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">My Ebook</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Access your purchased guides and resources.</p>
          </Link>
        </div>
      </div>

      <PayoutModal isOpen={showPayoutModal} onClose={() => setShowPayoutModal(false)} availableUsd={creatorStats.usdBalance} onSuccess={() => { fetchCreatorStats(); }} />
      <AuthModal isOpen={isAuthOpen} onClose={() => { setIsAuthOpen(false); navigate('/'); }} />
    </div>
  );
}
