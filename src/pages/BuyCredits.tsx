import React, { useState, useEffect } from 'react';
import { Coins, Check, Zap, ShieldCheck, Gift, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { initializePaddle, Paddle } from '@paddle/paddle-js';

// Paddle Credentials
const PADDLE_CLIENT_TOKEN = 'test_508e43bdb0bcfc3e72b7a8d97b4';

// Updated Price IDs provided by user
const PRICE_IDS: Record<string, string> = {
  // TODO: Update this ID with the new $5 Price ID from your Paddle Dashboard
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
              theme: 'light',
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
  }, []);

  const handlePurchaseClick = (plan: typeof PLANS[0]) => {
    // 1. Prevent "Refused to connect" error by blocking iframe attempts
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
    
    // Validation: Ensure Price ID is valid
    if (!priceId || !priceId.startsWith('pri_')) {
      alert(`Configuration Error: Invalid Price ID for ${plan.label}. It must start with 'pri_'. Please check the code.`);
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
          successUrl: window.location.href, // Optional: helps with some redirects
          displayMode: 'overlay',
        }
      });
    } catch (err: any) {
      console.error("Paddle Checkout Error:", err);
      alert("Failed to open checkout. Please ensure you have allowed this domain in your Paddle Dashboard.");
    }
  };

  const handlePaddleSuccess = async (data: any) => {
    // Extract credits from customData if available
    let creditsToAdd = 0;
    
    if (data.custom_data && data.custom_data.credits) {
      creditsToAdd = parseInt(data.custom_data.credits);
    }

    // Fallback: Match based on price ID
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-28 pb-24 px-4 transition-colors duration-300 relative overflow-hidden">
      
      {/* Aesthetic Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(to_bottom,#000_60%,transparent_100%)] pointer-events-none z-0"></div>

      <div className="relative z-10 max-w-5xl mx-auto">
        
        {/* Debug/Help Banner for "Refused to Connect" */}
        {isIframe && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8 flex items-start gap-3 animate-pulse">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800 dark:text-red-200">
              <p className="font-bold text-lg mb-1">Action Required: Open in New Tab</p>
              <p className="mb-2">
                Payments <strong>will not work</strong> in this preview window due to browser security (you will see a "refused to connect" error).
              </p>
              <p className="font-bold">
                👉 Please click the "Open in New Tab" button (top-right of the preview pane) to test payments.
              </p>
            </div>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Top Up Your Wallet</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">Unlock premium prompts and support creators directly.</p>
          
          {wallet && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-full border border-gray-200 dark:border-slate-800 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 text-sm">Current Balance:</span>
              <span className="font-bold text-sky-500 flex items-center gap-1">
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
              className={`relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-3xl p-8 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                plan.popular 
                  ? 'border-sky-500 ring-4 ring-sky-500/10 shadow-lg shadow-sky-500/10' 
                  : 'border-gray-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider text-sm mb-2">{plan.label}</h3>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">${plan.price}</span>
                  <span className="text-slate-400 text-lg">USD</span>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-sky-500 font-bold text-xl">
                  <Coins className="w-6 h-6 fill-current" />
                  {plan.credits} Credits
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>{plan.desc}</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Support Creators Directly</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Never Expires</span>
                </li>
              </ul>

              <button
                onClick={() => handlePurchaseClick(plan)}
                disabled={loadingPaddle}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  plan.popular
                    ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
                }`}
              >
                {loadingPaddle ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                {loadingPaddle ? 'Loading...' : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>

        {/* Coupon Section */}
        <div className="max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
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
              className="flex-1 px-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
            />
            <button
              type="submit"
              disabled={redeeming || !couponCode.trim()}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
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
