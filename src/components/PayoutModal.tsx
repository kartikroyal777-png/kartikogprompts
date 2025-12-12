import React, { useState, useEffect } from 'react';
import { X, DollarSign, Wallet, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface PayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCredits: number;
  onSuccess: () => void;
}

const MIN_CREDITS = 120; // $10
const RATE = 12; // 12 credits = $1

export default function PayoutModal({ isOpen, onClose, availableCredits, onSuccess }: PayoutModalProps) {
  const [amount, setAmount] = useState<number>(MIN_CREDITS);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'success'>('input');

  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setAmount(Math.max(MIN_CREDITS, Math.min(availableCredits, 1200))); // Default suggestion
      setError(null);
    }
  }, [isOpen, availableCredits]);

  if (!isOpen) return null;

  const usdValue = (amount / RATE).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount < MIN_CREDITS) {
      setError(`Minimum withdrawal is ${MIN_CREDITS} credits ($10).`);
      return;
    }
    if (amount > availableCredits) {
      setError("Insufficient available credits.");
      return;
    }
    if (!details.trim()) {
      setError("Please provide payout details.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('request_payout', {
        p_credits: amount,
        p_details: details
      });

      if (error) throw error;

      setStep('success');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 dark:border-slate-800"
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-sky-500" />
              Request Payout
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {step === 'input' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-sky-50 dark:bg-sky-900/10 p-4 rounded-xl border border-sky-100 dark:border-sky-900/30 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider mb-1">Available Balance</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{availableCredits} Credits</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Est. Value</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-500">${(availableCredits / RATE).toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Withdrawal Amount (Credits)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={MIN_CREDITS}
                      max={availableCredits}
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none font-bold text-lg"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                      = ${usdValue} USD
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Minimum withdrawal: {MIN_CREDITS} credits ($10)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Payout Details
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                    placeholder="e.g. PayPal: email@example.com or UPI: user@upi"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || availableCredits < MIN_CREDITS}
                  className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      Request ${usdValue} Payout
                      <DollarSign className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-500">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Request Sent!</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Your payout request for <strong>{amount} Credits</strong> (${usdValue}) has been submitted.
                  <br />Processing typically takes 2-3 business days.
                </p>
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
