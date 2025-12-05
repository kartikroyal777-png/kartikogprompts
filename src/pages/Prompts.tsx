import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import PromptCard from '../components/PromptCard';
import { Category, Prompt } from '../types';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

const CATEGORIES: Category[] = ['All', 'Couple', 'Kids', 'Men', 'Women', 'Animals', 'Landscape'];

const Prompts = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrompts();
  }, [activeCategory]);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('prompts')
        .select(`
          id,
          title,
          description,
          category,
          likes_count,
          monetization_url,
          credit_name,
          images:prompt_images(storage_path)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (activeCategory !== 'All') {
        query = query.eq('category', activeCategory);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match Prompt interface
      const formattedPrompts: Prompt[] = data.map((p: any) => {
        // Handle image path vs full URL (for demo data)
         let imageUrl = 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x400?text=No+Image';
         const storagePath = p.images?.[0]?.storage_path;
         
         if (storagePath) {
             if (storagePath.startsWith('http')) {
                 imageUrl = storagePath; // It's a full URL (demo data)
             } else {
                 imageUrl = supabase.storage.from('prompt-images').getPublicUrl(storagePath).data.publicUrl;
             }
         } else {
             // Fallback for demo data if we inserted prompts without images in SQL
             // We'll use a random unsplash image based on category
             imageUrl = `https://source.unsplash.com/800x600/?${p.category}`;
         }

        return {
          id: p.id,
          promptId: p.id.substring(0, 5), // Mock short ID
          title: p.title,
          description: p.description,
          author: p.credit_name || 'Admin',
          category: p.category,
          likes: p.likes_count || 0,
          image: imageUrl,
          monetization_url: p.monetization_url
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
    prompt.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full text-slate-600 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all",
                activeCategory === category
                  ? "bg-sky-500 text-white shadow-md"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading prompts...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        )}

        {!loading && filteredPrompts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-500 dark:text-slate-400 text-lg">No prompts found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Prompts;
