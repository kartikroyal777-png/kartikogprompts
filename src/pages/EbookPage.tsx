import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Check, Star, Zap, Shield, Gift, Lock, Download, HelpCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import AuthModal from '../components/AuthModal';
import DotGrid from '../components/DotGrid';

const EbookPage = () => {
  const { user, wallet, profile, refreshProfile } = useAuth();
  const { theme } = useTheme();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const EBOOK_PRICE = 20;
  const EBOOK_LINK = "https://www.canva.com/design/DAG6YzR_YAQ/YV_EEGgu0gcMyTXk0fTCfA/edit?utm_content=DAG6YzR_YAQ&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton";
  // Direct link to the image provided
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

  const testimonials = [
    { name: "Rohit", role: "Freelancer", content: "Saved me ₹12,000 in the first month alone." },
    { name: "Nishant", role: "Visual Creator", content: "The Dualite Alpha guide in this eBook is insane. I had no idea this tool could be accessed legally without paying for full access." },
    { name: "Aditi", role: "Content Creator", content: "I created 40+ AI videos without subscriptions. Worth every rupee." },
    { name: "Riya", role: "Aesthetic Editor", content: "The method in this eBook helped me use it completely free using official channels. Zero hacks, 100% safe." },
    { name: "Abhay", role: "Short-Form Editor", content: "The vibe-coding examples are next level. I recreated the exact Dualite Alpha moods I see on TikTok." },
    { name: "Varun", role: "Student", content: "The legal access methods here are better than any YouTube guide." },
    { name: "Shreya", role: "Social Media Manager", content: "I use the workflows daily for client work. Pure gold." },
    { name: "Divya", role: "Agency Owner", content: "The best investment I've made in 2025. Saves money and loads of time." },
    { name: "Zoya", role: "Student Creator", content: "This book made AI content creation affordable for me. Zero monthly subscriptions now." }
  ];

  const faqs = [
    { question: "Is this legal?", answer: "Yes, 100%. We only teach you how to use official free tiers, trials, research previews, and legal alternatives provided by the companies themselves." },
    { question: "Do I need a credit card?", answer: "For most methods, no. Some trials might require one, but we show you how to manage them safely." },
    { question: "Will these methods expire?", answer: "We update the eBook regularly. As long as these companies offer free tiers or trials, these methods work." },
    { question: "How do I get the eBook?", answer: "After purchase, you will get instant access to the Canva link where you can read or download the guide." }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pt-24 pb-12 transition-colors duration-300 relative overflow-hidden">
      
      {/* Background Animation */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <DotGrid 
          baseColor={theme === 'dark' ? '#0ea5e9' : '#38bdf8'}
          activeColor="#0284c7"
          dotSize={8}
          gap={80}
        />
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-center gap-12 mb-20">
          {/* Cover Image */}
          <div className="w-full md:w-1/2 order-1 md:order-2">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.6 }}
              className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-sky-500/20 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            >
              <img 
                src={COVER_IMAGE} 
                alt="AI Tools Guide Cover" 
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>

          {/* Content */}
          <div className="w-full md:w-1/2 order-2 md:order-1 text-center md:text-left">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-black mb-6 text-slate-900 dark:text-white leading-tight"
            >
              Stop Paying for <span className="text-sky-600 dark:text-sky-400">AI Subscriptions</span>
            </motion.h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
              Unlock Veo 3, Sora 2 Pro, Midjourney & more for FREE using legal, hidden workflows.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              {isUnlocked ? (
                <button 
                  onClick={handlePurchase}
                  className="bg-green-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-green-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-green-500/25"
                >
                  <ExternalLink className="w-5 h-5" />
                  Access Ebook Content
                </button>
              ) : (
                <button 
                  onClick={handlePurchase}
                  disabled={loading}
                  className="bg-sky-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-sky-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Get Access Now • 20 Credits
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 font-medium">
              Instant Access • Lifetime Updates • 100% Legal
            </p>
          </div>
        </div>

        {/* What's Inside Grid */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white">What's Inside?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 p-8 rounded-2xl hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Massive ROI Section */}
        <div className="mb-24 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-black dark:to-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          
          <h2 className="text-3xl font-bold text-center mb-2 relative z-10">Massive ROI</h2>
          <p className="text-center text-slate-400 mb-10 relative z-10">This eBook Saves You More Than ₹10,000 Instantly</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-4">
              {[
                { label: "Veo 3 subscription value", val: "₹3,500+" },
                { label: "Sora-level video tools", val: "₹4,000+" },
                { label: "Midjourney membership", val: "₹2,400+" },
                { label: "Dualite Alpha Access Guide", val: "₹3,000+" },
                { label: "Additional premium tools", val: "₹2,000+" },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="font-mono text-red-400 line-through decoration-red-500/50">{item.val}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4">
                <span className="font-bold text-lg text-white">Total Real Value</span>
                <span className="font-mono font-bold text-2xl text-green-400">₹14,900+</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center">
              <div className="text-sm text-sky-300 font-bold mb-2 uppercase tracking-wider">Your Price Today</div>
              <div className="text-6xl font-black text-white mb-2">20</div>
              <div className="text-xl font-bold text-sky-300 mb-2">Credits</div>
              <div className="text-slate-400 line-through text-lg mb-8">₹10,000</div>
              
              <button 
                onClick={handlePurchase}
                className="w-full bg-sky-500 text-white font-bold py-4 rounded-xl hover:bg-sky-400 transition-colors mb-6 shadow-lg shadow-sky-500/20"
              >
                {isUnlocked ? "Access Content" : "Get Access Now"}
              </button>
              
              <div className="flex justify-center gap-6 text-xs text-slate-300 font-medium">
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-400" /> Instant Download</span>
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-green-400" /> Lifetime Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Masonry */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white">Trusted by 1,000+ Creators</h2>
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm break-inside-avoid hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{t.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{t.role}</div>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">"{t.content}"</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10 text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200">{faq.question}</span>
                  {openFaqIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-sky-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                {openFaqIndex === index && (
                  <div className="px-6 py-4 text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 leading-relaxed">
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
