import React, { useEffect, useState, Suspense, useMemo, useRef } from 'react';
import { Search, Sparkles, ArrowRight, Clock, Box, Loader2, ChevronRight, Zap, Lightbulb, Brain, Check, Star, ShieldCheck, Crown, TrendingUp, BarChart, User, ShoppingBag, Percent, GraduationCap, PenTool, Briefcase, Megaphone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PromptCard from '../components/PromptCard';
import { supabase } from '../lib/supabase';
import { Prompt } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AuthModal from '../components/AuthModal';
import { getImageUrl } from '../lib/utils';

// Lazy load threads
const Threads = React.lazy(() => import('../components/Threads'));

// Icon Mapping for Super Prompts
const CATEGORY_ICONS: Record<string, any> = {
  'Finance': TrendingUp,
  'SEO': BarChart,
  'Solopreneurs': User,
  'E-Commerce': ShoppingBag,
  'Sales': Percent,
  'Education': GraduationCap,
  'Productivity': Zap,
  'Writing': PenTool,
  'Business': Briefcase,
  'Marketing': Megaphone
};

// Reviews Data
const REVIEWS = [
  { text: "Insane value for a lifetime deal. The business and brand prompts alone are worth it.", author: "Ryan M.", role: "Solopreneur" },
  { text: "Perfect for beginners and growing creators. The prompts are structured and easy to use.", author: "Ayesha K.", role: "Content Creator" },
  { text: "Saved me hours every week. I use OG Prompts for product descriptions and sales copy.", author: "Daniel R.", role: "E-commerce Owner" },
  { text: "Image prompts are next-level. Midjourney results improved instantly.", author: "Sofia L.", role: "Brand Designer" },
  { text: "Worth way more than $10. Lifetime access, no ads, constant updates.", author: "Mark T.", role: "Startup Founder" },
  { text: "Great for business and finance prompts. Planning and strategy prompts are solid.", author: "Rahul S.", role: "Indie Founder" },
  { text: "Easy to use, zero learning curve. Just copy, paste, and tweak.", author: "Emily J.", role: "Freelancer" },
  { text: "Helped improve my marketing output. Content and ads are way more structured now.", author: "Lucas W.", role: "Digital Marketer" },
  { text: "Lifetime updates sealed the deal. The team clearly plans to keep improving it.", author: "Natalie P.", role: "Small Business Owner" },
  { text: "One of my smartest micro-purchases. Paid for itself in the first week.", author: "Kevin D.", role: "Solo Founder" }
];

const FAQS = [
  { q: "What is OG Prompts?", a: "OG Prompts is the ultimate prompt library designed to help you get high-quality results from AI tools like ChatGPT and image generators. It includes prompts for personality building, product photoshoots, branding, business, finance, sales, and solopreneurs—all in one place." },
  { q: "Who is OG Prompts best for?", a: "Solopreneurs, founders, freelancers, creators, brand owners, marketers, designers, and anyone from beginners to intermediate AI users." },
  { q: "How can OG Prompts help my business?", a: "Create better content faster, improve marketing copy, generate brand visuals, plan business strategies, and save time by using proven prompt templates instead of guessing." },
  { q: "What types of prompts are included?", a: "Personality & role-based prompts, Image & product photoshoot prompts, Business & startup templates, Finance & planning prompts, Sales, marketing & content prompts, and Custom-request prompts (Pro users)." },
  { q: "Is OG Prompts beginner-friendly?", a: "Yes. Every prompt is designed to be simple, clear, and easy to customize. You don’t need prompt-engineering experience to get great results." },
  { q: "Is this a subscription?", a: "No. The Pro Lifetime plan is a one-time payment of $10. You get all future updates at no extra cost." },
  { q: "Is there a money-back guarantee?", a: "Yes. We offer a 7-day money-back guarantee, so you can try OG Prompts risk-free." }
];

export default function Home() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [productPrompts, setProductPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSuper, setLoadingSuper] = useState(true);
  const [superPrompts, setSuperPrompts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const threadsColor = useMemo<[number, number, number]>(() => 
    theme === 'dark' ? [1, 1, 1] : [0, 0, 0], 
  [theme]);

  useEffect(() => {
    fetchAllPrompts();
    fetchSuperPrompts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // FIX: Using a synchronous wrapper for the async logic inside setTimeout
    const delayDebounceFn = setTimeout(() => {
      const performSearch = async () => {
        if (searchQuery.trim().length >= 2) {
          setIsSearching(true);
          setShowResults(true);
          try {
            const { data, error } = await supabase
              .from('prompts')
              .select(`id, title, prompt_type, image, prompt_images(storage_path, order_index), category`)
              .eq('is_published', true)
              .ilike('title', `%${searchQuery}%`)
              .limit(6);

            if (error) throw error;

            const formatted = (data || []).map((p: any) => {
               const rawImages = p.prompt_images || [];
               const imagesList = rawImages
                  .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
                  .map((img: any) => getImageUrl(img.storage_path));
              let imageUrl = imagesList[0] || getImageUrl(p.image);
              return { ...p, image: imageUrl };
            });
            setSearchResults(formatted);
          } catch (error) {
            console.error("Search error:", error);
          } finally {
            setIsSearching(false);
          }
        } else {
          setSearchResults([]);
          setShowResults(false);
        }
      };
      performSearch();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  async function fetchAllPrompts() {
    setLoading(true);
    try {
      const [standardRes, productRes] = await Promise.all([
        supabase
          .from('prompts')
          .select(`*, prompt_images(storage_path, order_index)`)
          .eq('is_published', true)
          .eq('prompt_type', 'standard')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('prompts')
          .select(`*, prompt_images(storage_path, order_index)`)
          .eq('is_published', true)
          .eq('prompt_type', 'product')
          .order('created_at', { ascending: false })
          .limit(6)
      ]);

      const formatPrompts = (data: any[]) => (data || []).map((p: any) => {
         const rawImages = p.prompt_images || p.images || [];
         const imagesList = rawImages
            .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
            .map((img: any) => getImageUrl(img.storage_path));
        let imageUrl = imagesList[0] || getImageUrl(p.image);
        return {
          ...p,
          short_id: p.short_id,
          promptId: p.short_id ? p.short_id.toString() : p.id.substring(0, 5),
          image: imageUrl,
          images: imagesList.length > 0 ? imagesList : [imageUrl],
          author: p.credit_name || 'Admin',
          likes: p.likes_count || 0,
          categories: p.categories || [p.category]
        };
      });

      setPrompts(formatPrompts(standardRes.data || []));
      setProductPrompts(formatPrompts(productRes.data || []));
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSuperPrompts() {
      setLoadingSuper(true);
      try {
          // Join with categories to get name
          const { data } = await supabase
            .from('super_prompts')
            .select(`
                id, 
                title, 
                what_it_does, 
                category_id,
                category:super_prompt_categories(name)
            `)
            .limit(4)
            .order('created_at', { ascending: false });
          setSuperPrompts(data || []);
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingSuper(false);
      }
  }

  const handleBecomeCreatorClick = () => {
    if (user) {
      navigate('/become-creator');
    } else {
      setIsAuthOpen(true);
    }
  };

  const handleResultClick = (id: string) => {
    navigate(`/prompt/${id}`);
    setShowResults(false);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-gray-200 dark:border-gray-800">
        <div className="absolute inset-0 z-0 bg-grid-checks opacity-50 pointer-events-none" />
        <div className="absolute inset-0 z-10 opacity-40 pointer-events-none">
          <Suspense fallback={<div />}>
            <Threads amplitude={1.5} distance={0} enableMouseInteraction={true} color={threadsColor} />
          </Suspense>
        </div>
        
        {/* 3D Elements - Fixed for Mobile */}
        <div className="absolute top-[15%] left-4 lg:left-10 animate-spin-slow opacity-80 z-20 scale-75 lg:scale-100">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white dark:bg-black rounded-2xl shadow-2xl transform rotate-12 flex items-center justify-center text-black dark:text-white border-2 border-gray-200 dark:border-gray-800 backdrop-blur-md">
                <Brain className="w-8 h-8 lg:w-10 lg:h-10" />
            </div>
        </div>
        <div className="absolute bottom-[15%] right-4 lg:right-10 animate-bounce opacity-80 z-20 scale-75 lg:scale-100">
            <div className="w-20 h-20 lg:w-24 lg:h-24 bg-white dark:bg-black rounded-full shadow-2xl flex items-center justify-center text-black dark:text-white border-2 border-gray-200 dark:border-gray-800 backdrop-blur-md">
                <Lightbulb className="w-10 h-10 lg:w-12 lg:h-12" />
            </div>
        </div>

        <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 lg:pt-40 pb-24 text-center">
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex justify-center">
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold bg-gray-100 dark:bg-gray-900 text-black dark:text-white border border-gray-200 dark:border-gray-800 shadow-sm">
                <Sparkles className="w-4 h-4 mr-2 text-black dark:text-white" />
                The Ultimate Free Prompt Library
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-black dark:text-white leading-[1.1]">
              Unlock the full potential of <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-black dark:from-gray-400 dark:to-white">AI Tools</span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Discover the best AI prompts for Gemini & ChatGPT to supercharge your Personality, business and boost your productivity.
            </p>

            {/* Search */}
            <div ref={searchRef} className="max-w-md mx-auto relative z-50">
              <div className="relative group rounded-full transition-all duration-300 focus-within:ring-2 focus-within:ring-white focus-within:shadow-[0_0_20px_rgba(255,255,255,0.5)] bg-white dark:bg-gray-900 shadow-lg">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {isSearching ? <Loader2 className="h-5 w-5 text-gray-400 animate-spin" /> : <Search className="h-5 w-5 text-gray-400" />}
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if(searchQuery.length >= 2) setShowResults(true); }}
                  className="block w-full pl-11 pr-4 py-4 bg-transparent text-black dark:text-white rounded-full focus:outline-none transition-all placeholder-gray-400 font-medium"
                  placeholder="Search any prompt..."
                />
              </div>
              {showResults && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  {searchResults.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {searchResults.map((result) => (
                        <div key={result.id} onClick={() => handleResultClick(result.id)} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                            <img src={result.image} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{result.title}</h4>
                            <p className="text-xs text-gray-500 capitalize">{result.prompt_type} • {result.category}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {isSearching ? 'Searching...' : 'No results found.'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Buttons - Mobile Fixed Row */}
            <div className="flex flex-row justify-center gap-3 pt-4">
              <button onClick={handleBecomeCreatorClick} className="flex-1 sm:flex-none bg-white text-black font-bold px-4 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-lg hover:bg-gray-100 transition-all shadow-lg border border-gray-200 flex items-center justify-center gap-2 transform hover:-translate-y-1">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                Become Creator
              </button>
              <Link to="/prompts" className="flex-1 sm:flex-none bg-white dark:bg-gray-900 text-black dark:text-white font-bold px-4 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all border border-gray-200 dark:border-gray-800 flex items-center justify-center gap-2">
                Browse Prompts
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Personality Prompts (Standard) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Personality Prompts
          </h2>
          <Link to="/prompts" className="text-sm font-bold hover:underline">View All</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="aspect-[4/5] bg-gray-100 dark:bg-gray-900 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {prompts.map((prompt) => <PromptCard key={prompt.id} prompt={prompt} />)}
          </div>
        )}
      </div>

      {/* Product Prompts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
            <Box className="w-6 h-6" />
            Product Prompts
          </h2>
          <Link to="/product-prompts" className="text-sm font-bold hover:underline">View All</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="aspect-[4/5] bg-gray-100 dark:bg-gray-900 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {productPrompts.map((prompt) => <PromptCard key={prompt.id} prompt={prompt} />)}
          </div>
        )}
      </div>

      {/* Super Prompts - Updated Styling */}
      <div className="bg-white dark:bg-black py-16 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
                    <Zap className="w-6 h-6 text-white fill-black dark:fill-white" />
                    Super Prompts
                </h2>
                <Link to="/super-prompts" className="text-sm font-bold hover:underline">View All</Link>
            </div>
            
            {loadingSuper ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-100 dark:bg-gray-900 rounded-xl animate-pulse" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {superPrompts.map(prompt => {
                        const Icon = CATEGORY_ICONS[prompt.category?.name] || Zap;
                        return (
                            <Link 
                                to="/super-prompts" 
                                key={prompt.id} 
                                className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] dark:hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all group"
                            >
                                <div className="mb-3 w-10 h-10 rounded-lg bg-black dark:bg-white flex items-center justify-center text-white dark:text-black">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 group-hover:text-black dark:group-hover:text-white transition-colors">{prompt.title}</h3>
                                <p className="text-sm text-slate-500 line-clamp-2">{prompt.what_it_does}</p>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
      </div>

      {/* Pro Plan Benefits - Black Theme */}
      <div className="bg-black text-white py-20 overflow-hidden relative border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
                <span className="inline-block px-4 py-1 rounded-full border border-white/20 text-white text-xs font-bold mb-4 shadow-[0_0_10px_rgba(255,255,255,0.3)]">LIFETIME DEAL</span>
                <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">Why Go Pro?</h2>
                <p className="text-xl opacity-80 max-w-2xl mx-auto">One payment. Forever access. No monthly fees.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
                {[
                    { icon: Crown, title: "Unlock Everything", desc: "Access every prompt, template, and guide instantly." },
                    { icon: Zap, title: "Enhancer Power", desc: "5 daily prompt enhancer trials to turn messy thoughts into gold." },
                    { icon: ShieldCheck, title: "Commercial Use", desc: "Use prompts for client work and products." },
                    { icon: Star, title: "Priority Requests", desc: "Request custom prompts from our team." },
                    { icon: Box, title: "No Ads", desc: "Clean, focused experience without distractions." },
                    { icon: Check, title: "Lifetime Updates", desc: "Get all future prompts for free." }
                ].map((item, i) => (
                    <div key={i} className="bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10 hover:border-white/30 transition-colors">
                        <item.icon className="w-8 h-8 mb-4 text-white" />
                        <h3 className="font-bold text-xl mb-2 text-white">{item.title}</h3>
                        <p className="opacity-70 text-sm text-gray-300">{item.desc}</p>
                    </div>
                ))}
            </div>

            <div className="text-center">
                <Link to="/pricing" className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                    Get Pro for $10 <ArrowRight className="w-5 h-5" />
                </Link>
            </div>
        </div>
      </div>

      {/* Auto Sliding Reviews */}
      <div className="py-20 bg-gray-50 dark:bg-black overflow-hidden border-b border-gray-200 dark:border-gray-800">
        <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Trusted by Creators</h2>
        </div>
        
        <div className="relative w-full">
            <div className="flex gap-6 animate-scroll w-max hover:pause-animation">
                {[...REVIEWS, ...REVIEWS].map((review, i) => (
                    <div key={i} className="w-80 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex-shrink-0">
                        <div className="flex gap-1 mb-3">
                            {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 text-black dark:text-white fill-black dark:fill-white" />)}
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-sm mb-4 leading-relaxed">"{review.text}"</p>
                        <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm">{review.author}</div>
                            <div className="text-xs text-slate-500">{review.role}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white">Frequently Asked Questions</h2>
        <div className="space-y-4">
            {FAQS.map((faq, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
                    <button
                        onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="font-bold text-slate-900 dark:text-white">{faq.q}</span>
                        {openFaqIndex === index ? <ChevronRight className="w-5 h-5 rotate-90 transition-transform" /> : <ChevronRight className="w-5 h-5 transition-transform" />}
                    </button>
                    {openFaqIndex === index && (
                        <div className="px-6 py-4 text-slate-600 dark:text-slate-400 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 text-sm leading-relaxed">
                            {faq.a}
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}
