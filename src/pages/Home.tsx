import React, { useEffect, useState, Suspense, useMemo } from 'react';
import { Search, Sparkles, ArrowRight, Clock, Box } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PromptCard from '../components/PromptCard';
import { supabase } from '../lib/supabase';
import { Prompt } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AuthModal from '../components/AuthModal';
import { getImageUrl } from '../lib/utils';

// Lazy load threads to improve initial load performance
const Threads = React.lazy(() => import('../components/Threads'));

export default function Home() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Memoize color to prevent Threads re-initialization on every render
  const threadsColor = useMemo<[number, number, number]>(() => 
    theme === 'dark' ? [1, 1, 1] : [0, 0, 0], 
  [theme]);

  useEffect(() => {
    fetchPrompts();
  }, []);

  async function fetchPrompts() {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select(`
          *,
          images:prompt_images(storage_path, order_index)
        `)
        .eq('is_published', true)
        .eq('prompt_type', 'standard')
        .order('created_at', { ascending: false })
        .limit(9);

      if (error) throw error;
      
      const formattedPrompts = (data || []).map((p: any) => {
         const imagesList = (p.images || [])
            .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
            .map((img: any) => getImageUrl(img.storage_path));

        // Use the new robust helper for image resolution
        let imageUrl = imagesList[0];
        if (!imageUrl) {
           imageUrl = getImageUrl(p.image);
        }

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

      setPrompts(formattedPrompts);
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

  const filteredPrompts = prompts.filter(prompt => 
    prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    prompt.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-gray-200 dark:border-gray-800">
        
        {/* Checkered Background (Behind Threads) */}
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

            {/* Search Bar */}
            <div className="max-w-md mx-auto relative glow-focus rounded-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-full focus:outline-none transition-all shadow-sm"
                placeholder="Search prompts..."
              />
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

      {/* Latest Drops */}
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
            {filteredPrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        )}
      </div>

      {/* Product Prompts Teaser */}
      <div className="bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="bg-black dark:bg-white rounded-3xl p-8 md:p-12 text-white dark:text-black relative overflow-hidden glow-button">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 dark:bg-black/10 rounded-full text-xs font-bold">
                            <Box className="w-4 h-4" />
                            NEW FEATURE
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black">Product Photography Prompts</h2>
                        <p className="text-gray-300 dark:text-gray-600 text-lg">
                            Dedicated prompts for brands, startups, and agencies. Create stunning product shots with consistent style and branding.
                        </p>
                        <Link to="/product-prompts" className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-black text-black dark:text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
                            Explore Product Prompts <ArrowRight className="w-4 h-4" />
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
