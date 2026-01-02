import React, { useEffect, useState, Suspense, useMemo, useRef } from 'react';
import { Search, Sparkles, ArrowRight, Clock, Box, Loader2, ChevronRight } from 'lucide-react';
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

export default function Home() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [productPrompts, setProductPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const threadsColor = useMemo<[number, number, number]>(() => 
    theme === 'dark' ? [1, 1, 1] : [0, 0, 0], 
  [theme]);

  // Initial Data Fetch
  useEffect(() => {
    fetchAllPrompts();
  }, []);

  // Click Outside to Close Search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        setShowResults(true);
        try {
          const { data, error } = await supabase
            .from('prompts')
            .select(`
              id, 
              title, 
              prompt_type, 
              image, 
              prompt_images(storage_path, order_index),
              category
            `)
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

            return {
              ...p,
              image: imageUrl,
            };
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
          .limit(9),
        supabase
          .from('prompts')
          .select(`*, prompt_images(storage_path, order_index)`)
          .eq('is_published', true)
          .eq('prompt_type', 'product')
          .order('created_at', { ascending: false })
          .limit(6)
      ]);

      if (standardRes.error) throw standardRes.error;
      if (productRes.error) throw productRes.error;
      
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
        
        {/* Checkered Background */}
        <div className="absolute inset-0 z-0 bg-grid-checks opacity-50 pointer-events-none" />

        {/* Optimized Threads Background */}
        <div className="absolute inset-0 z-10 opacity-40 pointer-events-none">
          <Suspense fallback={<div />}>
            <Threads
              amplitude={1.5}
              distance={0}
              enableMouseInteraction={true}
              color={threadsColor}
            />
          </Suspense>
        </div>
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-24 text-center">
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex justify-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gray-100 dark:bg-gray-900 text-black dark:text-white border border-gray-200 dark:border-gray-800">
                <Sparkles className="w-4 h-4 mr-2" />
                The #1 AI Prompt Library
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-black dark:text-white leading-[1.1]">
              Free, Open-Source <br/>
              <span className="text-gray-500 dark:text-gray-400">AI Prompts</span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Discover and share high-quality AI art prompts. 
              Totally free, no sign-up required.
            </p>

            {/* Global Search Bar */}
            <div ref={searchRef} className="max-w-md mx-auto relative z-50">
              <div className="relative group rounded-full transition-all duration-300 focus-within:ring-2 focus-within:ring-white/50 focus-within:shadow-[0_0_20px_rgba(255,255,255,0.3)] bg-gray-50 dark:bg-gray-900">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {isSearching ? <Loader2 className="h-5 w-5 text-gray-400 animate-spin" /> : <Search className="h-5 w-5 text-gray-400" />}
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if(searchQuery.length >= 2) setShowResults(true); }}
                  className="block w-full pl-11 pr-4 py-4 bg-transparent border border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-full focus:outline-none transition-all shadow-sm placeholder-gray-400"
                  placeholder="Search any prompt..."
                />
              </div>

              {/* Search Results Dropdown */}
              {showResults && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  {searchResults.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {searchResults.map((result) => (
                        <div 
                          key={result.id}
                          onClick={() => handleResultClick(result.id)}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                        >
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

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link
                to="/prompts"
                className="bg-black dark:bg-white text-white dark:text-black font-bold px-8 py-4 rounded-full text-lg hover:opacity-90 transition-opacity glow-button"
              >
                Browse Prompts
              </Link>
              
              {profile?.creator_badge ? (
                <Link
                  to="/upload"
                  className="bg-gray-100 dark:bg-gray-900 text-black dark:text-white font-bold px-8 py-4 rounded-full text-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors glow-button"
                >
                  Upload Prompt
                </Link>
              ) : (
                <button
                  onClick={handleBecomeCreatorClick}
                  className="bg-gray-100 dark:bg-gray-900 text-black dark:text-white font-bold px-8 py-4 rounded-full text-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors glow-button"
                >
                  Become a Creator
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Latest Drops (Standard) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Latest Drops
          </h2>
          <Link to="/prompts" className="text-sm font-bold hover:underline">View All</Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-gray-100 dark:bg-gray-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {prompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        )}
      </div>

      {/* Product Prompts Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
            <Box className="w-6 h-6" />
            Product Prompts
          </h2>
          <Link to="/product-prompts" className="text-sm font-bold hover:underline">View All</Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-gray-100 dark:bg-gray-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {productPrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
            {productPrompts.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                    No product prompts yet.
                </div>
            )}
          </div>
        )}
      </div>

      {/* Product Prompts Teaser Banner */}
      <div className="bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="bg-black dark:bg-white rounded-3xl p-8 md:p-12 text-white dark:text-black relative overflow-hidden glow-button">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 dark:bg-black/10 rounded-full text-xs font-bold">
                            <Box className="w-4 h-4" />
                            FEATURED COLLECTION
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black">Level Up Your Brand</h2>
                        <p className="text-gray-300 dark:text-gray-600 text-lg">
                            Explore our curated collection of professional product photography prompts designed for agencies and startups.
                        </p>
                        <Link to="/product-prompts" className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-black text-black dark:text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
                            View Product Collection <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="w-full md:w-1/3 aspect-square bg-gray-800 dark:bg-gray-200 rounded-2xl flex items-center justify-center">
                        <Box className="w-24 h-24 text-gray-600 dark:text-gray-400" />
                    </div>
                </div>
            </div>
        </div>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}
