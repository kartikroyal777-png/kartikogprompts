import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, LogOut, Wallet, User, Heart, Image as ImageIcon, DollarSign, RefreshCw, Users, CreditCard, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import PayoutModal from '../components/PayoutModal';
import UserListModal from '../components/UserListModal';
import { Subscriber, EarningEntry, Prompt } from '../types';
import PromptCard from '../components/PromptCard';

const Profile = () => {
  const { user, profile, wallet, refreshWallet, refreshProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'prompts' | 'settings'>('prompts');
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  
  // Stats & Lists
  const [totalLikes, setTotalLikes] = useState(0);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [earnings, setEarnings] = useState<EarningEntry[]>([]);
  
  // Prompts
  const [myPrompts, setMyPrompts] = useState<Prompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  
  // Modals
  const [showSubscribersModal, setShowSubscribersModal] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);

  // Edit Profile
  const [displayName, setDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const isAdmin = user?.email === 'kartikroyal777@gmail.com';

  useEffect(() => {
    if (profile) {
      setDisplayName(isAdmin ? 'Admin' : (profile.full_name || ''));
      // Fetch stats if creator, admin, OR has earnings
      if (profile.role === 'creator' || isAdmin || (wallet?.withdrawable_credits ?? 0) > 0) {
        fetchCreatorStats();
      }
      fetchMyPrompts();
    }
  }, [profile, user, wallet]);

  const fetchMyPrompts = async () => {
    if (!user) return;
    setLoadingPrompts(true);
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select(`
          *,
          images:prompt_images(storage_path, order_index)
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPrompts: Prompt[] = (data || []).map((p: any) => {
         const imagesList = (p.images || [])
            .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
            .map((img: any) => {
                if (img.storage_path.startsWith('http')) return img.storage_path;
                return supabase.storage.from('prompt-images').getPublicUrl(img.storage_path).data.publicUrl;
            });

        let imageUrl = 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x800/1e293b/FFF?text=No+Image';
        if (imagesList.length > 0) imageUrl = imagesList[0];
        else if (p.image) imageUrl = p.image;

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
          images: imagesList,
          monetization_url: p.monetization_url,
          is_paid: p.is_paid,
          price_credits: p.price_credits,
          is_bundle: p.is_bundle
        };
      });

      setMyPrompts(formattedPrompts);
      
      // Calculate total likes from prompts if not fetched separately
      const likes = formattedPrompts.reduce((sum, p) => sum + (p.likes || 0), 0);
      setTotalLikes(likes);

    } catch (error) {
      console.error("Error fetching prompts", error);
    } finally {
      setLoadingPrompts(false);
    }
  };

  const fetchCreatorStats = async () => {
    if (!user) return;
    try {
      // Fetch Subscribers
      const { data: subs, error: subError } = await supabase.rpc('get_subscribers', { p_creator_id: user.id });
      if (!subError) setSubscribers(subs || []);

      // Fetch Earnings
      const { data: earns, error: earnError } = await supabase.rpc('get_earnings_history', { p_creator_id: user.id });
      if (!earnError) setEarnings(earns || []);

    } catch (error) {
      console.error("Error fetching stats", error);
    }
  };

  if (!user || !profile) return null;

  const totalCredits = wallet?.balance_credits ?? 0;
  const earnedCredits = wallet?.withdrawable_credits ?? 0;
  const purchasedCredits = Math.max(0, totalCredits - earnedCredits);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const handleConvertCredits = async () => {
    if (earnedCredits < 15) {
      toast.error('Minimum 15 earned credits required to convert');
      return;
    }

    try {
      setConverting(true);
      const { error } = await supabase.rpc('convert_credits_to_usd', {
        credits_amount: 15
      });

      if (error) throw error;

      await refreshWallet();
      await refreshProfile(); // Refresh USD balance
      toast.success('Successfully converted 15 credits to $1 USD');
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

  // Condition to show creator tools: Creator Role OR Admin OR Has Earnings
  const showCreatorTools = profile.role === 'creator' || isAdmin || earnedCredits > 0;

  return (
    <div className="min-h-screen bg-white text-slate-900 pt-24 pb-12 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-slate-50 rounded-3xl p-8 mb-12 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-sky-500/20">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name || ''} className="w-full h-full rounded-full object-cover" />
              ) : (
                (isAdmin ? 'A' : (profile.full_name?.[0] || user.email?.[0] || '?')).toUpperCase()
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-1 flex items-center justify-center md:justify-start gap-2">
                  {isAdmin ? 'Admin' : (profile.full_name || 'User')}
                  {profile.creator_badge && <Sparkles className="w-5 h-5 text-purple-500 fill-purple-500/20" />}
                </h1>
                <p className="text-slate-500 font-medium">{user.email}</p>
              </div>
              
              {/* Wallet Stats */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Balance</div>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-purple-500" />
                    <span className="font-bold text-lg text-slate-900">{totalCredits}</span>
                  </div>
                </div>

                {showCreatorTools && (
                  <>
                    <button 
                      onClick={() => setShowEarningsModal(true)}
                      className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm hover:border-green-300 transition-colors group text-left"
                    >
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-green-600">Earned Credits</div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-green-500" />
                        <span className="font-bold text-lg text-slate-900">{earnedCredits}</span>
                      </div>
                    </button>

                    <button 
                      onClick={() => setShowSubscribersModal(true)}
                      className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm hover:border-sky-300 transition-colors group text-left"
                    >
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-sky-600">Subscribers</div>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-sky-500" />
                        <span className="font-bold text-lg text-slate-900">{subscribers.length}</span>
                      </div>
                    </button>

                    <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Likes</div>
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        <span className="font-bold text-lg text-slate-900">{totalLikes}</span>
                      </div>
                    </div>

                    <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">USD Wallet</div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="font-bold text-lg text-slate-900">${profile.usd_balance || 0}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Creator Actions */}
              {showCreatorTools && (
                <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
                  <button
                    onClick={handleConvertCredits}
                    disabled={earnedCredits < 15 || converting}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 ${converting ? 'animate-spin' : ''}`} />
                    Convert 15 Credits to $1
                  </button>
                  
                  <button
                    onClick={() => setIsPayoutModalOpen(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-600/20 flex items-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    Withdraw Funds
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 min-w-[160px]">
              <Link to="/buy-credits" className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-sky-500/20 text-center">
                Buy Credits
              </Link>
              <button onClick={handleSignOut} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-8">
          <button
            onClick={() => setActiveTab('prompts')}
            className={`px-8 py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'prompts' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            My Prompts
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-8 py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'settings' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myPrompts.map(prompt => (
                    <PromptCard key={prompt.id} prompt={prompt} />
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400 py-16 bg-slate-50 rounded-3xl border border-slate-100">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium text-slate-600">You haven't uploaded any prompts yet.</p>
                  <Link to="/upload" className="text-sky-500 hover:text-sky-600 font-bold mt-2 inline-block">
                    Upload your first prompt
                  </Link>
                </div>
              )}
            </>
          )}
          
          {activeTab === 'settings' && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm max-w-2xl">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Account Settings</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2">Email Address</label>
                  <input type="text" value={user.email} disabled className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isAdmin}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-medium disabled:bg-slate-50 disabled:text-slate-500" 
                  />
                  {isAdmin && <p className="text-xs text-red-500 mt-1">Admin name cannot be changed.</p>}
                </div>
                <button 
                  onClick={handleSaveProfile}
                  disabled={savingProfile || isAdmin}
                  className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
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
        onSuccess={refreshWallet}
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
