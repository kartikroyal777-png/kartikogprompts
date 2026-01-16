import React, { useState } from 'react';
import { Check, Zap, ShieldCheck, Crown, Loader2, Gift, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Pricing() {
  const { user, refreshProfile, isPro } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  
  // Simulate Payment for Pro Plan
  const handleUpgrade = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Check for affiliate ref
    const affiliateRef = localStorage.getItem('affiliate_ref');

    setLoading(true);
    try {
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Call RPC to upgrade and handle commission
      const { error } = await supabase.rpc('upgrade_to_pro', {
        p_user_id: user.id,
        p_affiliate_id: affiliateRef || null
      });

      if (error) throw error;

      await refreshProfile();
      toast.success("Welcome to Pro! You now have lifetime access.");
      navigate('/');
    } catch (error: any) {
      console.error("Upgrade failed:", error);
      toast.error("Upgrade failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        navigate('/auth');
        return;
    }
    if (couponCode.trim() === 'OG7740') {
        setLoading(true);
        try {
            const { error } = await supabase.rpc('upgrade_to_pro', { p_user_id: user.id });
            if (error) throw error;
            await refreshProfile();
            toast.success("Code Redeemed! Welcome to Pro.");
            setCouponCode('');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    } else {
        toast.error("Invalid Code");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black pt-28 pb-24 px-4 transition-colors duration-300 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(to_bottom,#000_60%,transparent_100%)] pointer-events-none z-0"></div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6">
            Lifetime Access Pricing
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Pay once, own it forever. No monthly subscriptions. No hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Free Plan */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm relative">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Free Starter</h3>
            <div className="text-4xl font-black text-slate-900 dark:text-white mb-6">$0</div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300"><Check className="w-5 h-5 text-green-500" /> Unlock all Free Prompts</li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300"><Check className="w-5 h-5 text-green-500" /> 5 Monthly Enhancer Trials</li>
              <li className="flex items-center gap-3 text-slate-400 dark:text-slate-600 line-through"><Check className="w-5 h-5" /> Premium Prompts</li>
              <li className="flex items-center gap-3 text-slate-400 dark:text-slate-600 line-through"><Check className="w-5 h-5" /> Prompt Engineering Guide</li>
              <li className="flex items-center gap-3 text-slate-400 dark:text-slate-600 line-through"><Check className="w-5 h-5" /> No Ads</li>
            </ul>
            <button className="w-full py-4 rounded-xl font-bold bg-gray-100 dark:bg-gray-800 text-slate-900 dark:text-white cursor-default">
              Current Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-black dark:bg-white rounded-3xl p-8 shadow-2xl relative overflow-hidden transform md:-translate-y-4 border-2 border-amber-500">
            <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">BEST VALUE</div>
            <h3 className="text-2xl font-bold text-white dark:text-black mb-2 flex items-center gap-2">
              Pro Lifetime <Crown className="w-6 h-6 text-amber-400" />
            </h3>
            <div className="text-4xl font-black text-white dark:text-black mb-6">$10 <span className="text-lg font-normal opacity-70">/ once</span></div>
            
            <ul className="space-y-4 mb-8 text-white dark:text-black">
              <li className="flex items-center gap-3"><Check className="w-5 h-5 text-amber-400" /> <strong>Unlock ALL Prompts Forever</strong></li>
              <li className="flex items-center gap-3"><Check className="w-5 h-5 text-amber-400" /> 5 daily prompt enhancer trials</li>
              <li className="flex items-center gap-3"><Check className="w-5 h-5 text-amber-400" /> Unlimited Custom Requests</li>
              <li className="flex items-center gap-3"><Check className="w-5 h-5 text-amber-400" /> Prompt Engineering Guide Book</li>
              <li className="flex items-center gap-3"><Check className="w-5 h-5 text-amber-400" /> No Ads & Lifetime Updates</li>
              <li className="flex items-center gap-3"><Check className="w-5 h-5 text-amber-400" /> Verified Pro Badge</li>
            </ul>

            {isPro ? (
              <button className="w-full py-4 rounded-xl font-bold bg-green-500 text-white cursor-default flex items-center justify-center gap-2">
                <Check className="w-5 h-5" /> Plan Active
              </button>
            ) : (
              <button 
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold bg-white dark:bg-black text-black dark:text-white hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get Lifetime Access'}
              </button>
            )}
          </div>
        </div>

        {/* Coupon */}
        <div className="max-w-md mx-auto bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-black dark:text-white">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Have a Code?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Enter code to unlock Pro instantly.</p>
            </div>
          </div>
          <form onSubmit={handleRedeem} className="flex flex-col sm:flex-row gap-3 sm:gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter code..."
              className="flex-1 px-4 py-3 sm:py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none w-full"
            />
            <button
              type="submit"
              disabled={loading || !couponCode.trim()}
              className="px-6 py-3 sm:py-2 bg-black dark:bg-white hover:opacity-80 text-white dark:text-black font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto whitespace-nowrap"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Redeem'}
            </button>
          </form>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
            <ShieldCheck className="w-4 h-4" />
            Secure payment. 30-day money-back guarantee.
          </div>
        </div>
      </div>
    </div>
  );
}
