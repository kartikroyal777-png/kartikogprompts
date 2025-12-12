import React from 'react';
import { Lock, Coins, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  cost: number;
  balance: number;
  loading: boolean;
}

const UnlockModal: React.FC<UnlockModalProps> = ({ 
  isOpen, onClose, onConfirm, title, cost, balance, loading 
}) => {
  if (!isOpen) return null;

  const canAfford = balance >= cost;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-200 dark:border-slate-800"
        >
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-500">
              <Lock className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Unlock Premium Prompt</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Use your credits to reveal the full prompt details for <strong>"{title}"</strong>.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400">Cost</span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <Coins className="w-4 h-4 text-amber-500" />
                  {cost} Credits
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-slate-200 dark:border-slate-700 pt-2">
                <span className="text-slate-500 dark:text-slate-400">Your Balance</span>
                <span className={`font-bold flex items-center gap-1 ${canAfford ? 'text-green-500' : 'text-red-500'}`}>
                  {balance} Credits
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {canAfford ? (
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Unlock'}
                </button>
              ) : (
                <button
                  onClick={() => window.location.href = '/buy-credits'}
                  className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition-colors"
                >
                  Buy More Credits
                </button>
              )}
              
              <button
                onClick={onClose}
                disabled={loading}
                className="w-full py-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UnlockModal;
