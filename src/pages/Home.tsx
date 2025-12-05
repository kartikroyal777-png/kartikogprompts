import React, { useEffect, useState } from 'react';
import { Search, Sparkles, ArrowRight, BookOpen, Zap, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import PromptCard from '../components/PromptCard';
import { supabase } from '../lib/supabase';
import { Prompt } from '../types';
import { motion } from 'framer-motion';

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
          profiles:author_id (
            full_name,
            instagram_handle
          )
        `)
        .eq('is_published', true)
        .order('likes_count', { ascending: false })
        .limit(9);

      if (error) throw error;
      setPrompts(data || []);
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
    (prompt.category && prompt.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700/20 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(0,0,0,0.2),rgba(0,0,0,0.5))] bg-center [mask-position:top]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-24 sm:pb-20">
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <div className="flex justify-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-inset ring-blue-600/20">
                <Sparkles className="w-4 h-4 mr-2" />
                Free AI Prompts Library
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
              Copy. Paste. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Create.</span>
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-normal">
              The internet's best collection of Midjourney, Seedream & Stable Diffusion prompts. 
              100% free. No sign-up required.
            </p>

            {/* Functional Search Bar - Reduced Width */}
            <div className="max-w-md mx-auto relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-200"></div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white dark:bg-gray-900 border-0 text-gray-900 dark:text-white placeholder:text-gray-500 ring-1 ring-inset ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-600 rounded-full text-sm sm:text-base shadow-sm transition-all"
                  placeholder="Search prompts (e.g. 'cinematic', 'portrait')..."
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/prompts"
                className="inline-flex items-center px-6 py-3 rounded-full text-white bg-blue-600 hover:bg-blue-700 font-medium transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5"
              >
                Browse All Prompts
              </Link>
              <Link
                to="/upload"
                className="inline-flex items-center px-6 py-3 rounded-full text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 font-medium transition-all hover:-translate-y-0.5"
              >
                Upload Prompt
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              Trending Now
            </h2>
            <p className="mt-1 text-gray-500 dark:text-gray-400">Most loved prompts this week</p>
          </div>
          <Link 
            to="/prompts" 
            className="group flex items-center text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full"
          >
            View All Prompts
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
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

      {/* Ebook Teaser Section - Integrated Theme */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-700">
            <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:linear-gradient(0deg,transparent,black)]" />
            
            <div className="relative grid md:grid-cols-2 gap-8 items-center p-8 sm:p-12">
              <div className="space-y-6">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-sm font-medium">
                  <Star className="w-4 h-4 mr-2 fill-yellow-500" />
                  Premium Resource
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-bold text-white">
                  Stop Paying for AI Tools.
                  <span className="block text-gray-400 text-xl sm:text-2xl mt-2 font-normal">Unlock Premium Access Legally.</span>
                </h2>
                
                <p className="text-gray-400 text-lg">
                  Get our "AI Access Mastery" eBook and learn how to use Veo 3, Sora 2, and Midjourney without expensive monthly subscriptions.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Link
                    to="/ebook"
                    className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    Get eBook (₹200)
                  </Link>
                  <a
                    href="https://www.instagram.com/kartik.ogprompts/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium backdrop-blur-sm transition-all border border-white/10"
                  >
                    DM for Discount
                  </a>
                </div>
              </div>
              
              <div className="relative flex justify-center md:justify-end">
                <div className="relative w-64 sm:w-72 aspect-[2/3] group perspective-1000">
                  {/* Glow effect */}
                  <div className="absolute -inset-4 bg-blue-500/30 rounded-full blur-3xl group-hover:bg-blue-500/40 transition-all duration-500" />
                  
                  {/* Book Image */}
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
