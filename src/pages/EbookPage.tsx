import React, { useState, useEffect } from 'react';
import { CheckCircle, Download, MessageCircle, Shield, Star, Zap, TrendingUp, Quote, AlertCircle, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import AuthModal from '../components/AuthModal';

export default function EbookPage() {
  const { user, wallet, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Google Drive direct image link
  const ebookImage = "https://lh3.googleusercontent.com/d/1m8rI80MB2hEuKdIk-N7KBb11m7INvj0m";
  const ebookPdfLink = "https://www.canva.com/design/DAG6YzR_YAQ/YV_EEGgu0gcMyTXk0fTCfA/edit?utm_content=DAG6YzR_YAQ&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton";
  const EBOOK_COST = 20;

  useEffect(() => {
    if (user) checkUnlockStatus();
  }, [user]);

  const checkUnlockStatus = async () => {
    try {
      const { data } = await supabase
        .from('ebook_unlocks')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (data) setIsUnlocked(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBuy = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if ((wallet?.balance_credits || 0) < EBOOK_COST) {
      if(confirm(`Insufficient credits. You need ${EBOOK_COST} credits. Buy credits now?`)) {
        navigate('/buy-credits');
      }
      return;
    }

    if (!confirm(`Unlock Ebook for ${EBOOK_COST} credits?`)) return;

    setLoading(true);
    try {
      const { error } = await supabase.rpc('buy_ebook', { p_cost: EBOOK_COST });
      if (error) throw error;

      await refreshProfile();
      setIsUnlocked(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPdf = () => {
    window.open(ebookPdfLink, '_blank');
  };

  // ... rest of the component (features, reviews, etc.) remains same ...
  // Re-rendering the main parts to ensure correct state usage

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}
      
      <div className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700/50 font-medium text-sm">
                <Star className="w-4 h-4 mr-2 fill-current" />
                Save ₹10,000+ Every Year
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Unlock Premium AI Tools <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">Legally for ₹0</span>
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                Stop paying expensive monthly subscriptions. This eBook reveals the exact legal methods creators use to access Veo 3, Sora 2, and Midjourney for free.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {isUnlocked ? (
                   <button 
                    onClick={handleOpenPdf}
                    className="inline-flex justify-center items-center px-8 py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-lg shadow-lg shadow-green-500/20 transition-all hover:-translate-y-1"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Open eBook Link
                  </button>
                ) : (
                  <button 
                    onClick={handleBuy}
                    disabled={loading}
                    className="inline-flex justify-center items-center px-8 py-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-lg shadow-lg shadow-sky-500/20 transition-all hover:-translate-y-1 disabled:opacity-70"
                  >
                    {loading ? 'Processing...' : (
                      <>
                        <Lock className="w-5 h-5 mr-2" />
                        Unlock for {EBOOK_COST} Credits
                      </>
                    )}
                  </button>
                )}
                
                <a 
                  href="https://www.instagram.com/ogduo.prompts/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center items-center px-8 py-4 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:-translate-y-1"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  DM for Support
                </a>
              </div>
            </motion.div>

            {/* Right Image */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative flex justify-center"
            >
              <div className="relative w-72 sm:w-96 aspect-[2/3]">
                <div className="absolute -inset-4 bg-gradient-to-br from-sky-500 to-blue-600 rounded-[2rem] blur-3xl opacity-30 animate-pulse" />
                <img 
                  src={ebookImage}
                  alt="AI Access Mastery eBook"
                  className="relative w-full h-full object-cover rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 transform hover:scale-105 transition-transform duration-500"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
