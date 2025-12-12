import React, { useState } from 'react';
import { Coins, Check, Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import PaymentModal from '../components/PaymentModal';

// Updated plans as per request
const PLANS = [
  { id: 'starter', price: 1, credits: 10, label: 'Starter', promptCount: 50, popular: false, desc: 'Unlock up to 50 prompts' },
  { id: 'pro', price: 10, credits: 100, label: 'Pro', promptCount: 500, popular: true, desc: 'Unlock up to 500 prompts' },
  { id: 'ultra', price: 50, credits: 500, label: 'Ultra', promptCount: 2500, popular: false, desc: 'Unlock up to 2500 prompts' },
];

export default function BuyCredits() {
  const { user, wallet, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null);

  const handlePurchaseClick = (plan: typeof PLANS[0]) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setSelectedPlan(plan);
  };

  const handlePaymentSuccess = async () => {
    if (!selectedPlan) return;
    
    try {
      // Call simulation RPC (In real app, this happens via webhook)
      const { error } = await supabase.rpc('simulate_topup', { p_amount_credits: selectedPlan.credits });
      
      if (error) throw error;
      
      await refreshProfile();
      setSelectedPlan(null);
      // alert(`Successfully added ${selectedPlan.credits} credits!`);
      // navigate('/profile'); // Optional: redirect or stay
    } catch (error: any) {
      console.error("Purchase failed", error);
      alert("Purchase failed: " + error.message);
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

        <div className="grid md:grid-cols-3 gap-8">
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
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                  plan.popular
                    ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/25'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
                }`}
              >
                <Zap className="w-5 h-5" />
                Buy Now
              </button>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
            <ShieldCheck className="w-4 h-4" />
            Secure payment processing by Stripe. No hidden fees.
          </div>
        </div>
      </div>

      <PaymentModal 
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        onSuccess={handlePaymentSuccess}
        amount={selectedPlan?.price || 0}
        credits={selectedPlan?.credits || 0}
        isAdmin={user?.email === 'kartikroyal777@gmail.com'}
      />
    </div>
  );
}
