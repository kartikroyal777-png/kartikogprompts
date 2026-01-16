import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle, DollarSign, Users, ArrowRight, Zap, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';

export default function BecomeCreator() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    instagram: '',
  });

  useEffect(() => {
    if (!user) {
      setIsAuthOpen(true);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    setLoading(true);

    try {
      // 1. Create Creator Profile
      const { error } = await supabase
        .from('creators')
        .insert({
          id: user.id,
          bio: formData.bio,
          social_instagram: formData.instagram,
          full_access_price_credits: 0 // Not used anymore
        });

      if (error) throw error;

      // 2. Update Profile Badge
      await supabase
        .from('profiles')
        .update({ creator_badge: true, role: 'creator' })
        .eq('id', user.id);

      await refreshProfile();
      navigate('/profile');
    } catch (error: any) {
      console.error("Error becoming creator", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pt-28 pb-24 px-4 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black dark:bg-white rounded-2xl mb-6 shadow-lg">
            <Sparkles className="w-8 h-8 text-white dark:text-black" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Join the Creator Economy</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">Turn your prompt engineering skills into income.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Zap, title: "Affiliate Commission", desc: "Earn 10 Credits (50%) for every Pro upgrade via your link." },
            { icon: Users, title: "Build Fanbase", desc: "Gain subscribers who love your style." },
            { icon: CheckCircle, title: "Weekly Payouts", desc: "Convert earned credits to real cash (USD)." }
          ].map((item, i) => (
            <div key={i} className="p-6 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 text-center">
              <div className="w-10 h-10 mx-auto bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-black dark:text-white mb-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <item.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Credit Conversion Info */}
        <div className="mb-8 p-4 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 text-center">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                💰 1 Credit = $0.50 USD • Minimum Payout: $10
            </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">Creator Bio</label>
            <textarea
              required
              rows={3}
              value={formData.bio}
              onChange={e => setFormData({...formData, bio: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
              placeholder="Tell us about your style (e.g. Cinematic, Anime, Realistic...)"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">Instagram Handle</label>
            <input
              type="text"
              value={formData.instagram}
              onChange={e => setFormData({...formData, instagram: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
              placeholder="@username"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-black dark:bg-white hover:opacity-90 text-white dark:text-black font-bold text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : (
              <>
                Launch Creator Profile
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
      <AuthModal isOpen={isAuthOpen} onClose={() => { setIsAuthOpen(false); navigate('/'); }} />
    </div>
  );
}
