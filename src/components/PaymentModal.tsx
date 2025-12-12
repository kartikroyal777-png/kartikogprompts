import React, { useState } from 'react';
import { X, CreditCard, Lock, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  credits: number;
  isAdmin?: boolean;
}

export default function PaymentModal({ isOpen, onClose, onSuccess, amount, credits, isAdmin }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  
  // Form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStep('processing');

    // Simulate payment delay
    setTimeout(() => {
      setLoading(false);
      setStep('success');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }, 2000);
  };

  const handleAdminBypass = () => {
    setLoading(true);
    setTimeout(() => onSuccess(), 500);
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
              <Lock className="w-5 h-5 text-green-500" />
              Secure Payment
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {step === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-sky-50 dark:bg-sky-900/10 p-4 rounded-xl border border-sky-100 dark:border-sky-900/30 flex justify-between items-center mb-6">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total to pay</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">${amount}.00</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 dark:text-slate-400">You get</p>
                    <p className="text-lg font-bold text-sky-600 dark:text-sky-400">{credits} Credits</p>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleAdminBypass}
                    className="w-full py-2 mb-4 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:bg-red-200"
                  >
                    Admin Bypass (Add Free)
                  </button>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cardholder Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Card Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      required 
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expiry</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={e => setExpiry(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CVC</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="123"
                      value={cvc}
                      onChange={e => setCvc(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 mt-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all active:scale-95"
                >
                  Pay ${amount}.00
                </button>
                
                <p className="text-xs text-center text-slate-400 mt-2 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" />
                  Payments are secure and encrypted.
                </p>
              </form>
            )}

            {step === 'processing' && (
              <div className="py-12 text-center">
                <Loader2 className="w-12 h-12 text-sky-500 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Processing Payment...</h3>
                <p className="text-slate-500 text-sm">Please do not close this window.</p>
              </div>
            )}

            {step === 'success' && (
              <div className="py-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Payment Successful!</h3>
                <p className="text-slate-500 text-sm mt-2">Adding credits to your wallet...</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
