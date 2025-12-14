import React, { useState, useEffect } from 'react';
import { Coins, Check, Zap, ShieldCheck, Gift, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { initializePaddle, Paddle } from '@paddle/paddle-js';

// Paddle Credentials
const PADDLE_CLIENT_TOKEN = 'test_508e43bdb0bcfc3e72b7a8d97b4';
const PADDLE_API_KEY = 'apikey_01kcecn9vtc3wrdxcvy7gha368'; // Used to fetch prices for products

// Product IDs mapped to plans
const PRODUCT_IDS = {
  starter: 'pro_01kcec1vp78f1xeeb0ntec9c4f',
  pro: 'pro_01kcec3f3k341wdy3h9ew7vg5c',
  ultra: 'pro_01kcec4andr9qyn6qbt8bacxay'
};

const PLANS = [
  { id: 'starter', price: 1, credits: 10, label: 'Starter', promptCount: 50, popular: false, desc: 'Unlock up to 50 prompts', productId: PRODUCT_IDS.starter },
  { id: 'pro', price: 10, credits: 100, label: 'Pro', promptCount: 500, popular: true, desc: 'Unlock up to 500 prompts', productId: PRODUCT_IDS.pro },
  { id: 'ultra', price: 50, credits: 500, label: 'Ultra', promptCount: 2500, popular: false, desc: 'Unlock up to 2500 prompts', productId: PRODUCT_IDS.ultra },
];

export default function BuyCredits() {
  const { user, wallet, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  // Paddle State
  const [paddle, setPaddle] = useState<Paddle | undefined>(undefined);
  const [priceIds, setPriceIds] = useState<Record<string, string>>({});
  const [loadingPaddle, setLoadingPaddle] = useState(true);
  
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

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
          }
        });
        setPaddle(paddleInstance);
        
        // Fetch Prices for Products
        await fetchPriceIds();
      } catch (error) {
        console.error("Failed to initialize Paddle:", error);
      } finally {
        setLoadingPaddle(false);
      }
    };

    initPaddle();
  }, []);

  const fetchPriceIds = async () => {
    // Helper to fetch price for a product
    const fetchPrice = async (productId: string) => {
      try {
        const response = await fetch(`https://sandbox-api.paddle.com/prices?product_id=${productId}&status=active`, {
          headers: {
            'Authorization': `Bearer ${PADDLE_API_KEY}`
          }
        });
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          return data.data[0].id; // Return the first active price ID
        }
      } catch (err) {
        console.error(`Error fetching price for ${productId}`, err);
      }
      return null;
    };

    const newPriceIds: Record<string, string> = {};
    for (const plan of PLANS) {
      const priceId = await fetchPrice(plan.productId);
      if (priceId) {
        newPriceIds[plan.id] = priceId;
      }
    }
    setPriceIds(newPriceIds);
  };

  const handlePurchaseClick = (plan: typeof PLANS[0]) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!paddle) {
      alert("Payment system is initializing. Please try again in a moment.");
      return;
    }

    const priceId = priceIds[plan.id];
    if (!priceId) {
      alert("Error: Could not load price configuration for this product. Please contact support.");
      return;
    }

    paddle.Checkout.open({
      items: [{ priceId: priceId, quantity: 1 }],
      customer: {
        email: user.email || '',
      },
      customData: {
        userId: user.id,
        credits: plan.credits.toString()
      }
    });
  };

  const handlePaddleSuccess = async (data: any) => {
    // In a real production app, you should listen to webhooks.
    // For this frontend-only/sandbox integration, we'll update credits client-side securely as possible.
    
    // Extract credits from customData if available, or infer from items
    let creditsToAdd = 0;
    
    // Try to find which plan was bought
    // Note: data structure depends on Paddle event version, assuming standard checkout object
    if (data.items) {
       // Logic to match purchased item to plan
       // For simplicity in this demo, we can rely on customData passed during checkout
       if (data.custom_data && data.custom_data.credits) {
         creditsToAdd = parseInt(data.custom_data.credits);
       }
    }

    // Fallback if custom_data isn't available in the event payload immediately
    // We can try to match the price ID from our state
    if (creditsToAdd === 0 && data.items) {
        for (const item of data.items) {
            const plan = PLANS.find(p => priceIds[p.id] === item.price_id);
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-28 pb-24 px-4 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
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
              className={`relative bg-white dark:bg-slate-900 rounded-3xl p-8 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
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
                disabled={loadingPaddle || !priceIds[plan.id]}
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
        <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm">
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
