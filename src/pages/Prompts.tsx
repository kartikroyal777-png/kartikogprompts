import React, { useState, useEffect } from 'react';
import { Search, Lock, Sparkles, Heart, Check, ChevronDown } from 'lucide-react';
import PromptCard from '../components/PromptCard';
import { Prompt, CategoryItem } from '../types';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { getImageUrl } from '../lib/utils';

const Prompts = () => {
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'likes'>('latest');
  
  // Hover state for subcategories
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [activeCategories, showPremiumOnly, sortBy]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('type', 'standard')
        .order('name');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Build hierarchy
        const parents = data.filter(c => !c.parent_id);
        const children = data.filter(c => c.parent_id);
        
        const structured = parents.map(p => ({
            ...p,
            subcategories: children.filter(c => c.parent_id === p.id)
        }));
        
        setCategories(structured);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCategory = (categoryName: string) => {
    if (categoryName === 'All') {
      setActiveCategories([]);
      return;
    }
    setActiveCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('prompts')
        .select(`*, prompt_images(storage_path, order_index)`)
        .eq('is_published', true)
        .eq('prompt_type', 'standard');

      if (activeCategories.length > 0) {
        query = query.overlaps('categories', activeCategories);
      }

      if (showPremiumOnly) {
        query = query.eq('is_paid', true);
      }

      if (sortBy === 'likes') {
        query = query.order('likes_count', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      const formattedPrompts: Prompt[] = (data || []).map((p: any) => {
         const rawImages = p.prompt_images || p.images || [];
         const imagesList = rawImages.map((img: any) => getImageUrl(img.storage_path));
        let imageUrl = imagesList[0];
        if (!imageUrl) {
           imageUrl = getImageUrl(p.image);
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
          images: imagesList.length > 0 ? imagesList : [imageUrl],
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
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8">
        
        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8 glow-focus rounded-full">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full text-black dark:text-white placeholder-gray-400 focus:outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Filters & Categories */}
        <div className="flex flex-col gap-6 mb-12">
          
          <div className="flex flex-wrap items-center justify-center gap-3">
             {/* Premium Filter */}
             <button
              onClick={() => setShowPremiumOnly(!showPremiumOnly)}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all border shadow-sm glow-button",
                showPremiumOnly
                  ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white"
              )}
            >
              {showPremiumOnly ? <Lock className="w-4 h-4 fill-current" /> : <Lock className="w-4 h-4" />}
              Premium
            </button>

            {/* Most Liked Filter */}
            <button
              onClick={() => setSortBy(sortBy === 'likes' ? 'latest' : 'likes')}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all border shadow-sm glow-button",
                sortBy === 'likes'
                  ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white"
              )}
            >
              <Heart className={cn("w-4 h-4", sortBy === 'likes' && "fill-current")} />
              Most Liked
            </button>
          </div>

          {/* Categories Multi-Select with Sliding Scroll (2 Rows) */}
          <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
            <div className="grid grid-rows-2 grid-flow-col gap-2 px-2 min-w-max">
                <button
                onClick={() => toggleCategory('All')}
                className={cn(
                    "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border glow-button whitespace-nowrap h-fit",
                    activeCategories.length === 0
                    ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                    : "bg-transparent border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white"
                )}
                >
                All
                </button>
                {categories.map((category) => {
                const isActive = activeCategories.includes(category.name);
                const hasSubcategories = category.subcategories && category.subcategories.length > 0;
                const isHovered = hoveredCategory === category.id;

                return (
                    <div 
                        key={category.id} 
                        className="relative group flex-shrink-0 h-fit"
                        onMouseEnter={() => setHoveredCategory(category.id)}
                        onMouseLeave={() => setHoveredCategory(null)}
                    >
                        <button
                        onClick={() => toggleCategory(category.name)}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-medium transition-all border flex items-center gap-1.5 glow-button whitespace-nowrap w-full justify-center",
                            isActive
                            ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                            : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                        )}
                        >
                        {isActive && <Check className="w-3 h-3" />}
                        {category.name}
                        {hasSubcategories && <ChevronDown className="w-3 h-3 opacity-50" />}
                        </button>

                        {/* Subcategories Dropdown */}
                        {hasSubcategories && isHovered && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                                {category.subcategories?.map(sub => (
                                    <button
                                        key={sub.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleCategory(sub.name);
                                        }}
                                        className={cn(
                                            "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                                            activeCategories.includes(sub.name)
                                                ? "bg-gray-100 dark:bg-gray-800 text-black dark:text-white font-bold"
                                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white"
                                        )}
                                    >
                                        {sub.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
                })}
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-gray-100 dark:bg-gray-900 rounded-2xl animate-pulse border border-gray-200 dark:border-gray-800" />
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
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <Sparkles className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No prompts found matching your criteria.</p>
            <button 
              onClick={() => {setSearchQuery(''); setActiveCategories([]); setShowPremiumOnly(false); setSortBy('latest');}}
              className="mt-4 text-black dark:text-white hover:underline font-bold text-sm"
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
