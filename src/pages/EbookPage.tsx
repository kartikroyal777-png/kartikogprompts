import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Check, Star, Zap, Shield, Gift, Download, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import AuthModal from '../components/AuthModal';

const EbookPage = () => {
  const { user, wallet, profile, refreshProfile } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const EBOOK_PRICE = 20;
  const EBOOK_LINK = "https://www.canva.com/design/DAG6YzR_YAQ/YV_EEGgu0gcMyTXk0fTCfA/edit?utm_content=DAG6YzR_YAQ&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton";
  const COVER_IMAGE = "https://lh3.googleusercontent.com/d/1m8rI80MB2hEuKdIk-N7KBb11m7INvj0m";

  const isUnlocked = profile?.ebook_access;

  const handlePurchase = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (isUnlocked) {
      window.open(EBOOK_LINK, '_blank');
      return;
    }

    const currentBalance = wallet?.balance_credits ?? 0;

    if (currentBalance < EBOOK_PRICE) {
      toast.error(`Insufficient credits. You need ${EBOOK_PRICE} credits.`);
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.rpc('buy_ebook', {
        p_cost: EBOOK_PRICE
      });

      if (error) throw error;

      await refreshProfile();
      toast.success('Ebook unlocked successfully!');
      window.open(EBOOK_LINK, '_blank');
      
    } catch (error) {
      console.error('Error purchasing ebook:', error);
      toast.error('Failed to purchase ebook');
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const features = [
    {
      icon: Shield,
      title: "Legal Access Methods",
      description: "Step-by-step methods to use Veo 3, Sora 2 Pro & Midjourney using official credits & trials."
    },
    {
      icon: Zap,
      title: "Unlimited Usage",
      description: "How to rotate platforms, resets, free credits, research portals & legal mirrors."
    },
    {
      icon: Star,
      title: "High-Quality Alternatives",
      description: "Free tools matching premium quality for images, videos, thumbnails, ads."
    },
    {
      icon: Gift,
      title: "Zero-Cost Workflows",
      description: "Blueprints to create YouTube videos, Reels, and Fiverr gigs without spending a dime."
    }
  ];

  const faqs = [
    { question: "Is this legal?", answer: "Yes, 100%. We only teach you how to use official free tiers, trials, research previews, and legal alternatives provided by the companies themselves." },
    { question: "Do I need a credit card?", answer: "For most methods, no. Some trials might require one, but we show you how to manage them safely." },
    { question: "Will these methods expire?", answer: "We update the eBook regularly. As long as these companies offer free tiers or trials, these methods work." },
    { question: "How do I get the eBook?", answer: "After purchase, you will get instant access to the Canva link where you can read or download the guide." }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white pt-24 pb-12 transition-colors duration-300 relative overflow-hidden">
      
      {/* Monochrome Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-center gap-12 mb-20">
          <div className="w-full md:w-1/2 order-1 md:order-2">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
            >
              <img 
                src={COVER_IMAGE} 
                alt="AI Tools Guide Cover" 
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>

          <div className="w-full md:w-1/2 order-2 md:order-1 text-center md:text-left">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-black mb-6 text-black dark:text-white leading-tight"
            >
              Stop Paying for <span className="text-gray-500">AI Subscriptions</span>
            </motion.h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              Unlock Veo 3, Sora 2 Pro, Midjourney & more for FREE using legal, hidden workflows.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              {isUnlocked ? (
                <button 
                  onClick={handlePurchase}
                  className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-full font-bold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <ExternalLink className="w-5 h-5" />
                  Access Content
                </button>
              ) : (
                <button 
                  onClick={handlePurchase}
                  disabled={loading}
                  className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-full font-bold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Get Access • 20 Credits
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-4 font-bold uppercase tracking-wider">
              Instant Access • Lifetime Updates • 100% Legal
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-center mb-12 text-black dark:text-white">What's Inside?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-2xl hover:border-black dark:hover:border-white transition-colors"
              >
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-black dark:text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-black dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10 text-black dark:text-white">FAQ</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="font-bold text-black dark:text-white">{faq.question}</span>
                  {openFaqIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {openFaqIndex === index && (
                  <div className="px-6 py-4 text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EbookPage;
