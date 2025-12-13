import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Download, MessageCircle, Shield, Star, Zap, 
  TrendingUp, Quote, Lock, ChevronDown, ChevronUp, 
  BookOpen, Infinity, ShieldCheck, Image as ImageIcon, 
  Banknote, ArrowRight, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

  const faqs = [
    { q: "Is this legal?", a: "Yes. We teach you how to use official trials, developer programs, and promotional credits provided by the AI companies themselves. No hacking or carding involved." },
    { q: "Do I need a credit card?", a: "For some methods, yes (for verification), but you won't be charged if you follow our steps." },
    { q: "Does it work worldwide?", a: "Most methods work globally. Some might require a VPN (we suggest free ones)." },
    { q: "Can I get a refund?", a: "Since this is a digital product unlocked with credits, we generally don't offer refunds. But if the methods stop working, DM us for support." }
  ];

  const features = [
    {
      icon: ShieldCheck,
      title: "Legal Access Methods",
      desc: "Step-by-step methods to use Veo 3, Sora 2 Pro & Midjourney using official credits & trials.",
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-900/20"
    },
    {
      icon: Infinity,
      title: "Unlimited Usage",
      desc: "How to rotate platforms, resets, free credits, research portals & legal mirrors.",
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      icon: ImageIcon,
      title: "High-Quality Alternatives",
      desc: "Free tools matching premium quality for images, videos, thumbnails, ads.",
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-900/20"
    },
    {
      icon: Banknote,
      title: "Zero-Cost Workflows",
      desc: "Blueprints to create YouTube videos, Reels, and Fiverr gigs without spending a dime.",
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-900/20"
    }
  ];

  const testimonials = [
    { name: "Rohit", role: "Freelancer", text: "Saved me ₹12,000 in the first month alone.", initial: "R", color: "from-blue-500 to-cyan-500" },
    { name: "Nishant", role: "Visual Creator", text: "The Dualite Alpha guide in this eBook is insane. I had no idea this tool could be accessed legally without paying for full access. Now I use it daily for vibe-coding and aesthetic scenes.", initial: "N", color: "from-purple-500 to-pink-500" },
    { name: "Aditi", role: "Content Creator", text: "I created 40+ AI videos without subscriptions. Worth every rupee.", initial: "A", color: "from-amber-500 to-orange-500" },
    { name: "Riya", role: "Aesthetic Editor", text: "I’ve always loved Dualite but couldn’t afford monthly subscriptions. The method in this eBook helped me use it completely free using official channels. Zero hacks, 100% safe.", initial: "R", color: "from-emerald-500 to-teal-500" },
    { name: "Abhay", role: "Short-Form Editor", text: "The vibe-coding examples are next level. I recreated the exact Dualite Alpha moods I see on TikTok and Instagram. The workflow is easy even for beginners.", initial: "A", color: "from-indigo-500 to-blue-500" },
    { name: "Varun", role: "Student", text: "The legal access methods here are better than any YouTube guide.", initial: "V", color: "from-rose-500 to-red-500" },
    { name: "Shreya", role: "Social Media Manager", text: "I use the workflows daily for client work. Pure gold.", initial: "S", color: "from-violet-500 to-purple-500" },
    { name: "Divya", role: "Agency Owner", text: "The best investment I’ve made in 2025. Saves money and loads of time.", initial: "D", color: "from-cyan-500 to-blue-500" },
    { name: "Zoya", role: "Student Creator", text: "This book made AI content creation affordable for me. Zero monthly subscriptions now.", initial: "Z", color: "from-fuchsia-500 to-pink-500" }
  ];

  const roiItems = [
    { item: "Veo 3 subscription value", value: "₹3,500+" },
    { item: "Sora-level video tools", value: "₹4,000+" },
    { item: "Midjourney membership", value: "₹2,400+" },
    { item: "Dualite Alpha Access Guide", value: "₹3,000+" },
    { item: "Additional premium tools", value: "₹2,000+" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}
      
      {/* Hero Section */}
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
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700/50 font-medium text-sm animate-pulse">
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

      {/* What's Inside Section */}
      <div className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">What's Inside?</h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Comprehensive guides and secret workflows to supercharge your content creation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-sky-500/50 dark:hover:border-sky-500/50 transition-all hover:shadow-lg group"
              >
                <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Massive ROI Section */}
      <div className="py-24 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-800/50 [mask-image:linear-gradient(0deg,transparent,black,transparent)]" />
        
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold text-sm mb-6">
              <TrendingUp className="w-4 h-4 mr-2" />
              Massive ROI
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-6">
              This eBook Saves You More Than <span className="text-green-600 dark:text-green-500">₹10,000 Instantly</span>
            </h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Why pay monthly subscriptions when you can get the same results for free? Here is the real value of what you're getting:
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-8 sm:p-12">
              <div className="space-y-4 mb-8">
                {roiItems.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-slate-600 dark:text-slate-300 font-medium text-lg">{item.item}</span>
                    <span className="text-slate-900 dark:text-white font-bold text-lg">{item.value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-4 border-t-2 border-slate-100 dark:border-slate-800 mt-4">
                  <span className="text-slate-900 dark:text-white font-black text-xl">Total Real Value</span>
                  <span className="text-slate-400 line-through font-bold text-xl">₹14,900+</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-100 dark:border-slate-800">
                <div className="text-center sm:text-left">
                  <div className="text-sm font-bold text-red-500 uppercase tracking-wider mb-1 flex items-center gap-2 justify-center sm:justify-start">
                    <Clock className="w-4 h-4" />
                    Limited-Time Offer
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                    Your Price Today <span className="text-green-600 dark:text-green-500">₹200</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">(Unlock for just {EBOOK_COST} Credits)</p>
                </div>

                <div className="flex flex-col gap-3 w-full sm:w-auto">
                  {isUnlocked ? (
                    <button 
                      onClick={handleOpenPdf}
                      className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download Now
                    </button>
                  ) : (
                    <button 
                      onClick={handleBuy}
                      className="px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Lock className="w-5 h-5" />
                      Get Access Now
                    </button>
                  )}
                  <p className="text-xs text-center text-red-500 font-medium">Price increasing soon</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-8 text-center">
                <div className="flex flex-col items-center gap-1">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Instant Download</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Infinity className="w-5 h-5 text-blue-500" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Lifetime Access</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Free Updates</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">Trusted by 1,000+ Creators Already</h2>
            <p className="text-xl text-slate-500 dark:text-slate-400">
              Join the community of creators who are saving thousands on AI tools every month.
            </p>
          </div>

          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            {testimonials.map((review, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="break-inside-avoid bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow"
              >
                <Quote className="w-8 h-8 text-sky-200 dark:text-sky-900 mb-4" />
                <p className="text-slate-700 dark:text-slate-300 mb-6 font-medium leading-relaxed">"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${review.color} flex items-center justify-center text-white font-bold shadow-sm`}>
                    {review.initial}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{review.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">{review.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-24 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span className="font-bold text-slate-900 dark:text-white text-lg">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 pt-0 text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
