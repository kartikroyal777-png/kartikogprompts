import React, { useEffect, useState } from 'react';
import { Search, Sparkles, ArrowRight, BookOpen, Zap, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import PromptCard from '../components/PromptCard';
import { supabase } from '../lib/supabase';
import { Prompt } from '../types';

export default function Home() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Google Drive direct image link
  const ebookImage = "https://lh3.googleusercontent.com/d/1m8rI80MB2hEuKdIk-N7KBb11m7INvj0m";

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
        .order('likes_count', { ascending: false })
        .limit(9);

      if (error) throw error;
      
      const formattedPrompts = (data || []).map((p: any) => {
         // Process multiple images
         const imagesList = (p.images || [])
            .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
            .map((img: any) => {
              if (img.storage_path.startsWith('http')) return img.storage_path;
              return supabase.storage.from('prompt-images').getPublicUrl(img.storage_path).data.publicUrl;
            });

         let imageUrl = 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x800/1e293b/FFF?text=No+Image';
         if (imagesList.length > 0) {
             imageUrl = imagesList[0];
         } else if (p.image) {
            imageUrl = p.image;
         }

        return {
          ...p,
          short_id: p.short_id,
          // Use short_id if available, otherwise fallback to substring
          promptId: p.short_id ? p.short_id.toString() : p.id.substring(0, 5),
          image: imageUrl,
          images: imagesList,
          author: p.credit_name || 'Admin',
          likes: p.likes_count || 0
        };
      });

      setPrompts(formattedPrompts);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filter prompts based on search
  const filteredPrompts = prompts.filter(prompt => 
    prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (prompt.category && prompt.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
    prompt.promptId.includes(searchQuery) // Allow searching by ID in home too
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        {/* Gradient Check Background - Expanded mask to spread further down */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(to_bottom,#000_60%,transparent_100%)]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 sm:pt-32 sm:pb-32">
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <div className="flex justify-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300 ring-1 ring-inset ring-sky-600/20">
                <Sparkles className="w-4 h-4 mr-2" />
                The #1 AI Prompt Library
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
              Free, Open-Source <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">AI Prompts</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-normal leading-relaxed">
              The #1 free platform to discover and share high-quality AI art prompts. 
              Totally free, no sign-up required.
            </p>

            {/* Search Bar */}
            <div className="max-w-md mx-auto relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-200"></div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white dark:bg-gray-900 border-0 text-gray-900 dark:text-white placeholder:text-gray-500 ring-1 ring-inset ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-sky-500 rounded-full text-sm sm:text-base shadow-sm transition-all"
                  placeholder="Search prompts (e.g. 'cinematic', '10012')..."
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link
                to="/prompts"
                className="inline-flex justify-center items-center px-8 py-3.5 rounded-full text-white bg-sky-500 hover:bg-sky-600 font-bold transition-all shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-105 active:scale-95 duration-300"
              >
                Browse All Prompts
              </Link>
              <Link
                to="/upload"
                className="inline-flex justify-center items-center px-8 py-3.5 rounded-full text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 font-bold transition-all shadow-sm hover:scale-105 active:scale-95 duration-300"
              >
                Upload Prompt
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between mb-8 gap-4 text-center sm:text-left">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
              <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              Trending Now
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Most loved prompts this week</p>
          </div>
          <Link 
            to="/prompts" 
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-5 py-2.5 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 font-semibold rounded-full hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-all hover:scale-105 active:scale-95"
          >
            View All Prompts
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl h-96 animate-pulse border border-gray-200 dark:border-gray-700" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.length > 0 ? (
              filteredPrompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 text-lg">No prompts found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ebook Teaser Section */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 dark:from-black dark:to-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:linear-gradient(0deg,transparent,black)]" />
            
            <div className="relative grid md:grid-cols-2 gap-8 items-center p-8 sm:p-12">
              <div className="space-y-6">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-sm font-medium">
                  <Star className="w-4 h-4 mr-2 fill-yellow-500" />
                  Premium Resource
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-bold text-white">
                  Stop Paying for AI Tools.
                  <span className="block text-slate-400 text-xl sm:text-2xl mt-2 font-normal">Unlock Premium Access Legally.</span>
                </h2>
                
                <p className="text-slate-400 text-lg">
                  Get our "AI Access Mastery" eBook and learn how to use Veo 3, Sora 2, and Midjourney without expensive monthly subscriptions.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Link
                    to="/ebook"
                    className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold shadow-lg shadow-sky-900/20 transition-all hover:-translate-y-0.5 hover:scale-105 active:scale-95"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    Get eBook (₹200)
                  </Link>
                  <a
                    href="https://www.instagram.com/ogduo.prompts/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium backdrop-blur-sm transition-all border border-white/10 hover:scale-105 active:scale-95"
                  >
                    DM for Discount
                  </a>
                </div>
              </div>
              
              <div className="relative flex justify-center md:justify-end">
                <div className="relative w-64 sm:w-72 aspect-[2/3] group perspective-1000">
                  <div className="absolute -inset-4 bg-sky-500/30 rounded-full blur-3xl group-hover:bg-sky-500/40 transition-all duration-500" />
                  <img 
                    src={ebookImage}
                    alt="AI Access Mastery eBook Cover" 
                    className="relative w-full h-full object-cover rounded-lg shadow-2xl transform rotate-y-12 group-hover:rotate-y-0 transition-transform duration-700 ease-out"
                    style={{ transformStyle: 'preserve-3d' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
