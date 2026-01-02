import React, { useState, useEffect } from 'react';
import { Search, Box, Lock, Heart } from 'lucide-react';
import PromptCard from '../components/PromptCard';
import { Prompt } from '../types';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { getImageUrl } from '../lib/utils';

const ProductPrompts = () => {
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
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .eq('type', 'product')
        .order('name');
        
      if (error) throw error;
      if (data && data.length > 0) {
        setCategories(data.map(c => c.name));
      } else {
        setCategories(['Cosmetics', 'Tech', 'Fashion', 'Food', 'Furniture']);
      }
    } catch (err) {
      setCategories(['Cosmetics', 'Tech', 'Fashion', 'Food', 'Furniture']);
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
        // Updated query to use direct table join if alias fails, or just fetch prompt_images
        .select(`*, prompt_images(storage_path, order_index)`)
        .eq('is_published', true)
        .eq('prompt_type', 'product');

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
         // Handle prompt_images from the new query structure
         const rawImages = p.prompt_images || [];
         const sortedImages = rawImages.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
         
         // Map to full URLs
         const imagesList = sortedImages.map((img: any) => getImageUrl(img.storage_path));

        // Determine main image
        let imageUrl = imagesList.length > 0 ? imagesList[0] : getImageUrl(null, 'Product');

        return {
          ...p,
          promptId: p.short_id ? p.short_id.toString() : p.id.substring(0, 5),
          image: imageUrl,
          images: imagesList.length > 0 ? imagesList : [imageUrl],
          author: p.credit_name || 'Admin',
          categories: p.categories || [p.category],
          prompt_type: 'product',
          likes: p.likes_count || 0,
          is_paid: p.is_paid,
          price_credits: p.price_credits
        };
      });

      setPrompts(formattedPrompts);
    } catch (error) {
      console.error('Error fetching product prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrompts = prompts.filter(prompt => 
    prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.promptId.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black pt-28 pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-2xl mb-6">
                <Box className="w-8 h-8 text-black dark:text-white" />
            </div>
            <h1 className="text-4xl font-black text-black dark:text-white mb-4">Product Prompts</h1>
            <p className="text-gray-500 max-w-2xl mx-auto">
                Professional prompts designed for brands and agencies. Consistent style, lighting, and composition for your product photography.
            </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col gap-6 mb-12">
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto w-full glow-focus rounded-xl">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none text-black dark:text-white"
              />
            </div>
          </div>

          {/* Filters Row */}
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

          {/* Categories */}
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => toggleCategory('All')}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-bold border transition-all glow-button",
                activeCategories.length === 0
                  ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                  : "bg-transparent border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white"
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-bold border transition-all glow-button",
                  activeCategories.includes(cat)
                    ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                    : "bg-transparent border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
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
        
        {!loading && filteredPrompts.length === 0 && (
            <div className="text-center py-20 text-gray-500">
                No product prompts found. Be the first to upload one!
            </div>
        )}
      </div>
    </div>
  );
};

export default ProductPrompts;
