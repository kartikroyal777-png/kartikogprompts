import React, { useState, useEffect } from 'react';
import { Coins, Check, Zap, ShieldCheck, Gift, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { initializePaddle, Paddle } from '@paddle/paddle-js';

// Paddle Credentials
const PADDLE_CLIENT_TOKEN = 'test_508e43bdb0bcfc3e72b7a8d97b4';

// Updated Price IDs provided by user
const PRICE_IDS: Record<string, string> = {
  starter: 'pri_01kcedde45xa69gnet6xz0eds9', 
  pro: 'pri_01kcedfkhj060kde35cfnkzn14',
  ultra: 'pri_01kcedjfvdppt5hfj3jss65dh4'
};

const PLANS = [
  { id: 'starter', price: 5, credits: 50, label: 'Starter', promptCount: 250, popular: false, desc: 'Unlock up to 250 prompts' },
  { id: 'pro', price: 10, credits: 100, label: 'Pro', promptCount: 500, popular: true, desc: 'Unlock up to 500 prompts' },
  { id: 'ultra', price: 50, credits: 500, label: 'Ultra', promptCount: 2500, popular: false, desc: 'Unlock up to 2500 prompts' },
];

export default function BuyCredits() {
  const { user, wallet, refreshProfile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  // Paddle State
  const [paddle, setPaddle] = useState<Paddle | undefined>(undefined);
  const [loadingPaddle, setLoadingPaddle] = useState(true);
  const [paddleError, setPaddleError] = useState<string | null>(null);
  
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  // Check if running in iframe
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  useEffect(() => {
    const initPaddle = async () => {
      try {
        const paddleInstance = await initializePaddle({ 
          environment: 'sandbox', 
          token: PADDLE_CLIENT_TOKEN,
          eventCallback: (data) => {
            if (data.name === 'checkout.completed') {
              handlePaddleSuccess(data.data);
            }
          },
          checkout: {
            settings: {
              displayMode: 'overlay',
              theme: theme === 'dark' ? 'dark' : 'light',
              locale: 'en'
            }
          }
        });
        setPaddle(paddleInstance);
      } catch (error: any) {
        console.error("Failed to initialize Paddle:", error);
        setPaddleError("Payment system failed to load. Please refresh.");
      } finally {
        setLoadingPaddle(false);
      }
    };

    initPaddle();
  }, [theme]);

  const handlePurchaseClick = (plan: typeof PLANS[0]) => {
    if (isIframe) {
      alert("⚠️ SECURITY RESTRICTION ⚠️\n\nPayment gateways cannot run inside this preview window.\n\nPlease click the 'Open in New Tab' button (top-right corner) to complete your purchase safely.");
      return;
    }

    if (!user) {
      navigate('/auth');
      return;
    }

    if (!paddle) {
      alert("Payment system is initializing. Please try again in a moment.");
      return;
    }

    const priceId = PRICE_IDS[plan.id];
    
    if (!priceId || !priceId.startsWith('pri_')) {
      alert(`Configuration Error: Invalid Price ID for ${plan.label}.`);
      return;
    }

    try {
      paddle.Checkout.open({
        items: [{ priceId: priceId, quantity: 1 }],
        customer: {
          email: user.email || '',
        },
        customData: {
          userId: user.id,
          credits: plan.credits.toString()
        },
        settings: {
          successUrl: window.location.href,
          displayMode: 'overlay',
        }
      });
    } catch (err: any) {
      console.error("Paddle Checkout Error:", err);
      alert("Failed to open checkout.");
    }
  };

  const handlePaddleSuccess = async (data: any) => {
    let creditsToAdd = 0;
    
    if (data.custom_data && data.custom_data.credits) {
      creditsToAdd = parseInt(data.custom_data.credits);
    }

    if (creditsToAdd === 0 && data.items) {
        for (const item of data.items) {
            const planId = Object.keys(PRICE_IDS).find(key => PRICE_IDS[key] === item.price_id);
            const plan = PLANS.find(p => p.id === planId);
            if (plan) {
                creditsToAdd += plan.credits * (item.quantity || 1);
            }
        }
    }

    if (creditsToAdd > 0) {
        try {
            const { error } = await supabase.rpc('simulate_topup', { p_amount_credits: creditsToAdd });
            if (error) throw error;
            await refreshProfile();
            alert(`Payment Successful! ${creditsToAdd} Credits added to your wallet.`);
        } catch (err: any) {
            console.error("Error adding credits:", err);
            alert("Payment successful, but failed to add credits automatically. Please contact support.");
        }
    }
  };

  const handleRedeemCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!couponCode.trim()) return;

    setRedeeming(true);
    try {
      if (couponCode.trim() === 'OGDUO7740') {
        const { error } = await supabase.rpc('simulate_topup', { p_amount_credits: 10 });
        if (error) throw error;
        
        await refreshProfile();
        alert("Coupon Redeemed! 10 Credits added to your wallet.");
        setCouponCode('');
      } else {
        alert("Invalid coupon code.");
      }
    } catch (error: any) {
      console.error("Redemption failed", error);
      alert("Redemption failed: " + error.message);
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black pt-28 pb-24 px-4 transition-colors duration-300 relative overflow-hidden">
      
      {/* Monochrome Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(to_bottom,#000_60%,transparent_100%)] pointer-events-none z-0"></div>

      <div className="relative z-10 max-w-5xl mx-auto">
        
        {isIframe && (
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-8 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-black dark:text-white flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-800 dark:text-gray-200">
              <p className="font-bold text-lg mb-1">Action Required: Open in New Tab</p>
              <p className="mb-2">
                Payments <strong>will not work</strong> in this preview window due to browser security.
              </p>
              <p className="font-bold">
                👉 Please click the "Open in New Tab" button to complete your purchase safely.
              </p>
            </div>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Top Up Your Wallet</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">Unlock premium prompts and support creators directly.</p>
          
          {wallet && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 text-sm">Current Balance:</span>
              <span className="font-bold text-black dark:text-white flex items-center gap-1">
                <Coins className="w-4 h-4 fill-current" />
                {wallet.balance_credits}
              </span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {PLANS.map((plan) => (
            <div 
              key={plan.id}
              className={`relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-3xl p-8 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                plan.popular 
                  ? 'border-black dark:border-white ring-2 ring-black/5 dark:ring-white/5 shadow-lg' 
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider text-sm mb-2">{plan.label}</h3>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">${plan.price}</span>
                  <span className="text-slate-400 text-lg">USD</span>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-black dark:text-white font-bold text-xl">
                  <Coins className="w-6 h-6 fill-current" />
                  {plan.credits} Credits
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                  <Check className="w-5 h-5 text-black dark:text-white flex-shrink-0" />
                  <span>{plan.desc}</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                  <Check className="w-5 h-5 text-black dark:text-white flex-shrink-0" />
                  <span>Support Creators Directly</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                  <Check className="w-5 h-5 text-black dark:text-white flex-shrink-0" />
                  <span>Never Expires</span>
                </li>
              </ul>

              <button
                onClick={() => handlePurchaseClick(plan)}
                disabled={loadingPaddle}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  plan.popular
                    ? 'bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-black dark:text-white'
                }`}
              >
                {loadingPaddle ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                {loadingPaddle ? 'Loading...' : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>

        {/* Coupon Section */}
        <div className="max-w-md mx-auto bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-black dark:text-white">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Have a Coupon Code?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Enter your code to get free credits.</p>
            </div>
          </div>
          
          <form onSubmit={handleRedeemCoupon} className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter code..."
              className="flex-1 px-4 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
            />
            <button
              type="submit"
              disabled={redeeming || !couponCode.trim()}
              className="px-6 py-2 bg-black dark:bg-white hover:opacity-80 text-white dark:text-black font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Redeem'}
            </button>
          </form>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
            <ShieldCheck className="w-4 h-4" />
            Secure payment processing by Paddle. No hidden fees.
          </div>
        </div>
      </div>
    </div>
  );
}
