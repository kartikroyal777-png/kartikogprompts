import React, { useState, useEffect } from 'react';
import { Search, Lock, Sparkles, Heart, Check } from 'lucide-react';
import PromptCard from '../components/PromptCard';
import { Prompt } from '../types';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

const Prompts = () => {
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'likes'>('latest');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [activeCategories, showPremiumOnly, sortBy]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('name').order('name');
      if (error) throw error;
      if (data && data.length > 0) {
        setCategories(data.map(c => c.name));
      } else {
        setCategories(['Couple', 'Kids', 'Men', 'Women', 'Animals', 'Landscape']);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories(['Couple', 'Kids', 'Men', 'Women', 'Animals', 'Landscape']);
    }
  };

  const toggleCategory = (category: string) => {
    if (category === 'All') {
      setActiveCategories([]);
      return;
    }
    setActiveCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('prompts')
        .select(`
          *,
          images:prompt_images(storage_path, order_index)
        `)
        .eq('is_published', true);

      // Filter by categories (OR logic: overlaps)
      if (activeCategories.length > 0) {
        query = query.overlaps('categories', activeCategories);
      }

      if (showPremiumOnly) {
        query = query.eq('is_paid', true);
      }

      // Sorting
      if (sortBy === 'likes') {
        query = query.order('likes_count', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match Prompt interface
      const formattedPrompts: Prompt[] = (data || []).map((p: any) => {
         const imagesList = (p.images || [])
            .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
            .map((img: any) => {
              if (img.storage_path.startsWith('http')) return img.storage_path;
              return supabase.storage.from('prompt-images').getPublicUrl(img.storage_path).data.publicUrl;
            });

         let imageUrl = 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x800/1e293b/FFF?text=No+Image';
         if (imagesList.length > 0) {
             imageUrl = imagesList[0];
         } else if (p.image) {
            imageUrl = p.image;
         }

        return {
          id: p.id,
          short_id: p.short_id,
          promptId: p.short_id ? p.short_id.toString() : p.id.substring(0, 5),
          title: p.title,
          description: p.description,
          author: p.credit_name || 'Admin',
          category: p.category,
          categories: p.categories || [p.category],
          likes: p.likes_count || 0,
          image: imageUrl,
          images: imagesList,
          monetization_url: p.monetization_url,
          is_paid: p.is_paid,
          price_credits: p.price_credits,
          is_bundle: p.is_bundle,
          creator_id: p.creator_id
        };
      });

      setPrompts(formattedPrompts);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrompts = prompts.filter(prompt => 
    prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.promptId.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8">
        
        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search prompts (e.g. 'Neon', '10012')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full text-slate-600 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Filters & Categories */}
        <div className="flex flex-col gap-6 mb-12">
          
          {/* Top Row Filters */}
          <div className="flex flex-wrap items-center justify-center gap-3">
             {/* Premium Filter */}
             <button
              onClick={() => setShowPremiumOnly(!showPremiumOnly)}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all border shadow-sm",
                showPremiumOnly
                  ? "bg-amber-500 text-white border-amber-500 shadow-amber-500/25"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-gray-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400"
              )}
            >
              {showPremiumOnly ? <Lock className="w-4 h-4 fill-current" /> : <Lock className="w-4 h-4" />}
              Premium
            </button>

            {/* Most Liked Filter */}
            <button
              onClick={() => setSortBy(sortBy === 'likes' ? 'latest' : 'likes')}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all border shadow-sm",
                sortBy === 'likes'
                  ? "bg-red-500 text-white border-red-500 shadow-red-500/25"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-gray-200 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400"
              )}
            >
              <Heart className={cn("w-4 h-4", sortBy === 'likes' && "fill-current")} />
              Most Liked
            </button>
          </div>

          {/* Categories Multi-Select */}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => toggleCategory('All')}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all border",
                activeCategories.length === 0
                  ? "bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/20"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-gray-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              All
            </button>
            {categories.map((category) => {
              const isActive = activeCategories.includes(category);
              return (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all border flex items-center gap-1.5",
                    isActive
                      ? "bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/20"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-gray-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  {isActive && <Check className="w-3 h-3" />}
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-gray-100 dark:bg-slate-900 rounded-2xl animate-pulse border border-gray-200 dark:border-slate-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">
            {filteredPrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        )}

        {!loading && filteredPrompts.length === 0 && (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <Sparkles className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">No prompts found matching your criteria.</p>
            <button 
              onClick={() => {setSearchQuery(''); setActiveCategories([]); setShowPremiumOnly(false); setSortBy('latest');}}
              className="mt-4 text-sky-500 hover:text-sky-600 font-bold text-sm"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Prompts;
