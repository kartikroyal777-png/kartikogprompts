import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Zap, ChevronRight, ArrowLeft, Copy, Check, Loader2, TrendingUp, BarChart, User, ShoppingBag, Percent, GraduationCap, PenTool, Briefcase, Megaphone, Lock, Heart, Info, Play, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SuperPromptCategory, SuperPrompt } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { getIsSuperLiked, toggleSuperLike } from '../lib/superLikes';
import { cn } from '../lib/utils';

// Icon Mapping
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

export default function SuperPrompts() {
  const { user, isPro } = useAuth();
  const [categories, setCategories] = useState<SuperPromptCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<SuperPromptCategory | null>(null);
  const [prompts, setPrompts] = useState<SuperPrompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<SuperPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Filters
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'likes'>('latest');

  // Like State for Detail View
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('super_prompt_categories').select('*').order('sort_order');
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedCategory) {
        fetchPrompts(selectedCategory);
    }
  }, [selectedCategory, showPremiumOnly, sortBy]);

  const fetchPrompts = async (category: SuperPromptCategory) => {
    setLoading(true);
    let query = supabase.from('super_prompts').select('*').eq('category_id', category.id);

    if (showPremiumOnly) {
        query = query.eq('is_premium', true);
    }

    if (sortBy === 'likes') {
        query = query.order('likes_count', { ascending: false });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    const { data } = await query;
    setPrompts(data || []);
    setLoading(false);
  };

  const handleCategoryClick = (category: SuperPromptCategory) => {
    setSelectedCategory(category);
    setSelectedPrompt(null);
  };

  const handlePromptClick = (prompt: SuperPrompt) => {
    setSelectedPrompt(prompt);
    setIsLiked(getIsSuperLiked(prompt.id));
    setLikesCount(prompt.likes_count || 0);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied!");
  };

  const handleLike = async () => {
      if (!selectedPrompt) return;
      const { newLikesCount, newIsLiked } = await toggleSuperLike(selectedPrompt.id, likesCount, isLiked);
      setLikesCount(newLikesCount);
      setIsLiked(newIsLiked);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black pt-24 pb-12 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-8 h-8 text-black dark:text-white fill-current" />
                Super Prompts
            </h1>
            <p className="text-slate-500">High-impact, specialized prompts for professionals.</p>
        </div>

        {/* Breadcrumbs */}
        {selectedCategory && (
            <div className="flex items-center justify-between mb-6">
                <button 
                    onClick={() => {
                        if (selectedPrompt) setSelectedPrompt(null);
                        else setSelectedCategory(null);
                    }}
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-black dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to {selectedPrompt ? selectedCategory.name : 'Categories'}
                </button>
            </div>
        )}

        {/* Loading State */}
        {loading && (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        )}

        {/* View 1: Categories Grid */}
        {!loading && !selectedCategory && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map(cat => {
                    const Icon = CATEGORY_ICONS[cat.name] || Zap;
                    return (
                        <button 
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat)}
                            className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all text-left group shadow-sm"
                        >
                            <div className="mb-4 p-3 bg-black dark:bg-white rounded-xl w-fit text-white dark:text-black transition-colors">
                                <Icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{cat.name}</h3>
                            <p className="text-xs text-slate-500 line-clamp-2">{cat.description}</p>
                        </button>
                    );
                })}
            </div>
        )}

        {/* View 2: Prompts List */}
        {!loading && selectedCategory && !selectedPrompt && (
            <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedCategory.name} Prompts</h2>
                    
                    {/* Filters */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowPremiumOnly(!showPremiumOnly)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border",
                                showPremiumOnly
                                ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800"
                            )}
                        >
                            {showPremiumOnly ? <Lock className="w-3 h-3 fill-current" /> : <Lock className="w-3 h-3" />}
                            Premium
                        </button>
                        <button
                            onClick={() => setSortBy(sortBy === 'likes' ? 'latest' : 'likes')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border",
                                sortBy === 'likes'
                                ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800"
                            )}
                        >
                            <Heart className={cn("w-3 h-3", sortBy === 'likes' && "fill-current")} />
                            Most Liked
                        </button>
                    </div>
                </div>

                <div className="grid gap-4">
                    {prompts.map(prompt => (
                        <div 
                            key={prompt.id}
                            onClick={() => handlePromptClick(prompt)}
                            className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white cursor-pointer flex items-center justify-between group transition-all"
                        >
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-slate-900 dark:text-white">{prompt.title}</h3>
                                    {prompt.is_premium && <Lock className="w-3 h-3 text-amber-500" />}
                                </div>
                                <p className="text-sm text-slate-500 line-clamp-1">{prompt.what_it_does}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                    <Heart className="w-3 h-3" /> {prompt.likes_count || 0}
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-black dark:group-hover:text-white" />
                            </div>
                        </div>
                    ))}
                    {prompts.length === 0 && <p className="text-slate-500 italic">No prompts in this category yet.</p>}
                </div>
            </div>
        )}

        {/* View 3: Prompt Detail */}
        {!loading && selectedPrompt && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-black mb-2 text-slate-900 dark:text-white leading-tight">{selectedPrompt.title}</h1>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-bold text-slate-500">{selectedCategory?.name}</span>
                            {selectedPrompt.is_premium && <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded text-xs font-bold flex items-center gap-1"><Lock className="w-3 h-3" /> Premium</span>}
                        </div>
                    </div>
                    <button 
                        onClick={handleLike}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all",
                            isLiked 
                                ? "bg-red-50 dark:bg-red-900/20 text-red-500" 
                                : "bg-gray-100 dark:bg-gray-800 text-slate-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                        )}
                    >
                        <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                        {likesCount}
                    </button>
                </div>
                
                <div className="space-y-10">
                    {/* 1. What It Does Section */}
                    <section>
                        <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
                            <Info className="w-4 h-4" /> What This Prompt Does
                        </h3>
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedPrompt.what_it_does}</p>
                        </div>
                    </section>

                    {/* 2. Main Prompt Section */}
                    <section className="relative group">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold uppercase text-slate-400 flex items-center gap-2">
                                <Zap className="w-4 h-4" /> The Prompt
                            </h3>
                            <button 
                                onClick={() => handleCopy(selectedPrompt.prompt_content)}
                                className="flex items-center gap-2 text-xs font-bold bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 rounded-lg hover:opacity-80 transition-colors"
                            >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <div className="bg-gray-50 dark:bg-black p-6 rounded-xl border border-gray-200 dark:border-gray-800 font-mono text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap shadow-inner">
                            {selectedPrompt.prompt_content}
                        </div>
                    </section>

                    {/* 3. How To Use Section */}
                    <section>
                        <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
                            <Play className="w-4 h-4" /> How To Use
                        </h3>
                        <div className="bg-green-50 dark:bg-green-900/10 p-5 rounded-xl border border-green-100 dark:border-green-900/30">
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedPrompt.how_to_use}</p>
                        </div>
                    </section>

                    {/* 4. Example Output */}
                    {selectedPrompt.example_output_images && selectedPrompt.example_output_images.length > 0 && (
                        <section>
                            <h3 className="text-sm font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">
                                <Star className="w-4 h-4" /> Example Output
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {selectedPrompt.example_output_images.map((img, i) => (
                                    <img key={i} src={img} alt="Output" className="rounded-xl border border-gray-200 dark:border-gray-800 w-full h-auto shadow-md hover:scale-[1.02] transition-transform" />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
