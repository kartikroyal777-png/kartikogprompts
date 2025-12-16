import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { RateMeEntry } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Instagram, Twitter, Trophy, Crown, Medal, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface LeaderboardProps {
  refreshTrigger: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'Men' | 'Women'>('Men');
  const [entries, setEntries] = useState<RateMeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<{rank: number, score: number} | null>(null);

  // Admin Check
  const isAdmin = user?.email === 'kartikroyal777@gmail.com';

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, refreshTrigger]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // 1. Fetch Top 50 Entries
      const { data: rawEntries, error } = await supabase
        .from('rate_me_entries')
        .select('*')
        .eq('is_published', true)
        .eq('gender', activeTab)
        .order('final_score', { ascending: false })
        .limit(50);

      if (error) throw error;

      // 2. Manually join profiles (Application-level join)
      const userIds = rawEntries?.map((e: any) => e.user_id) || [];
      
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);
        profiles = profilesData || [];
      }

      // 3. Merge data
      const mergedData = rawEntries?.map((entry: any) => ({
        ...entry,
        user_profile: profiles.find((p: any) => p.id === entry.user_id)
      })) || [];

      setEntries(mergedData as any);

      // 4. Fetch User Rank if logged in AND NOT ADMIN
      if (user && !isAdmin) {
        const userInTop = mergedData.find((e: any) => e.user_id === user.id);
        if (userInTop) {
          setUserRank({ 
            rank: mergedData.indexOf(userInTop) + 1, 
            score: userInTop.final_score 
          });
        } else {
          // Check if user has an entry even if not in top 50
          const { data: myEntry } = await supabase
            .from('rate_me_entries')
            .select('final_score')
            .eq('user_id', user.id)
            .eq('gender', activeTab)
            .eq('is_published', true)
            .maybeSingle();
            
          if (myEntry) {
             const { count } = await supabase
              .from('rate_me_entries')
              .select('*', { count: 'exact', head: true })
              .eq('gender', activeTab)
              .eq('is_published', true)
              .gt('final_score', myEntry.final_score);
              
             setUserRank({ rank: (count || 0) + 1, score: myEntry.final_score });
          } else {
            setUserRank(null);
          }
        }
      } else {
        setUserRank(null); // Admins don't see their own rank bar
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (entryId: string, type: 'UP' | 'DOWN') => {
    if (!user) {
      toast.error("Please sign in to vote!");
      return;
    }

    // Optimistic Update
    setEntries(prev => prev.map(e => {
      if (e.id === entryId) {
        const change = type === 'UP' ? 0.01 : -0.01;
        return { ...e, final_score: e.final_score + change };
      }
      return e;
    }));

    try {
      const { error } = await supabase.rpc('handle_rate_me_vote', {
        p_entry_id: entryId,
        p_vote_type: type
      });

      if (error) throw error;
      toast.success(`Voted ${type === 'UP' ? 'Up' : 'Down'}!`);
    } catch (error: any) {
      console.error("Voting error:", error);
      toast.error("Vote failed: " + error.message);
      fetchLeaderboard(); // Revert on error
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400" />;
    if (index === 1) return <Medal className="w-6 h-6 text-slate-300 fill-slate-300" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-600 fill-amber-600" />;
    return <span className="text-lg font-bold text-slate-400 dark:text-slate-500 w-6 text-center">#{index + 1}</span>;
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-20">
      {/* Header / Timer */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-600 dark:text-yellow-500 text-sm font-bold mb-4">
          <Trophy className="w-4 h-4" />
          OG Aesthetic Icon of the Year
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Global Leaderboard</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Winners receive a Surprise Gift Box + Verified Creator Status.</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex">
          {['Men', 'Women'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab}'s Board
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800" />
          ))
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No entries yet. Be the first!</div>
        ) : (
          entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative bg-white dark:bg-slate-900 border ${user?.id === entry.user_id ? 'border-yellow-500/50 shadow-yellow-500/10' : 'border-slate-200 dark:border-slate-800'} rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow`}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-10 flex justify-center">
                {getRankIcon(index)}
              </div>

              {/* Avatar/Image */}
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-slate-200 dark:border-slate-700 group cursor-pointer">
                <img src={entry.image_url} alt="Entry" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-slate-900 dark:text-white font-bold truncate flex items-center gap-2">
                  {entry.player_name || entry.user_profile?.full_name || 'Anonymous'}
                  {user?.id === entry.user_id && <span className="text-[10px] bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded font-bold">YOU</span>}
                </h3>
                <div className="flex gap-2 mt-1">
                  {entry.social_links?.instagram && (
                    <a href={entry.social_links.instagram} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-pink-500 transition-colors"><Instagram className="w-3.5 h-3.5" /></a>
                  )}
                  {entry.social_links?.twitter && (
                    <a href={entry.social_links.twitter} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-sky-500 transition-colors"><Twitter className="w-3.5 h-3.5" /></a>
                  )}
                </div>
              </div>

              {/* Score */}
              <div className="text-right mr-2">
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{entry.final_score.toFixed(3)}</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Score</div>
              </div>

              {/* Voting */}
              <div className="flex flex-col gap-1 border-l border-slate-200 dark:border-slate-800 pl-4">
                <button 
                  onClick={() => handleVote(entry.id, 'UP')}
                  disabled={user?.id === entry.user_id}
                  className="p-1 text-slate-400 hover:text-green-500 hover:bg-green-500/10 rounded transition-colors disabled:opacity-30"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleVote(entry.id, 'DOWN')}
                  disabled={user?.id === entry.user_id}
                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors disabled:opacity-30"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Sticky User Rank Footer - Rendered via Portal to ensure top layer */}
      {user && userRank && !isAdmin && createPortal(
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-yellow-500/30 p-4 z-[99999] shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-500">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-yellow-600 dark:text-yellow-500 font-bold uppercase tracking-wider">Your Ranking</div>
                <div className="text-slate-900 dark:text-white font-bold flex items-center gap-2">
                  Rank #{userRank.rank}
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  Score: {userRank.score.toFixed(3)}
                </div>
              </div>
            </div>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
            >
              View Top
            </button>
          </div>
        </motion.div>,
        document.body
      )}
    </div>
  );
};

export default Leaderboard;
