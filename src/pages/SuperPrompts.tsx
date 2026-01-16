import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Zap, ChevronRight, ArrowLeft, Copy, Check, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SuperPromptCategory, SuperPrompt } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function SuperPrompts() {
  const { user, isPro } = useAuth();
  const [categories, setCategories] = useState<SuperPromptCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<SuperPromptCategory | null>(null);
  const [prompts, setPrompts] = useState<SuperPrompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<SuperPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('super_prompt_categories').select('*').order('sort_order');
    setCategories(data || []);
    setLoading(false);
  };

  const handleCategoryClick = async (category: SuperPromptCategory) => {
    setSelectedCategory(category);
    setLoading(true);
    const { data } = await supabase.from('super_prompts').select('*').eq('category_id', category.id);
    setPrompts(data || []);
    setLoading(false);
    setSelectedPrompt(null);
  };

  const handlePromptClick = (prompt: SuperPrompt) => {
    setSelectedPrompt(prompt);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied!");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black pt-24 pb-12 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-8 h-8 text-amber-500 fill-amber-500" />
                Super Prompts
            </h1>
            <p className="text-slate-500">High-impact, specialized prompts for professionals.</p>
        </div>

        {/* Breadcrumbs */}
        {selectedCategory && (
            <button 
                onClick={() => {
                    if (selectedPrompt) setSelectedPrompt(null);
                    else setSelectedCategory(null);
                }}
                className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-black dark:hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back
            </button>
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
                {categories.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat)}
                        className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-amber-500 dark:hover:border-amber-500 transition-all text-left group shadow-sm hover:shadow-md"
                    >
                        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 group-hover:text-amber-600 transition-colors">
                            <Zap className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{cat.name}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2">{cat.description}</p>
                    </button>
                ))}
            </div>
        )}

        {/* View 2: Prompts List */}
        {!loading && selectedCategory && !selectedPrompt && (
            <div>
                <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">{selectedCategory.name} Prompts</h2>
                <div className="grid gap-4">
                    {prompts.map(prompt => (
                        <div 
                            key={prompt.id}
                            onClick={() => handlePromptClick(prompt)}
                            className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 cursor-pointer flex items-center justify-between group transition-all"
                        >
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">{prompt.title}</h3>
                                <p className="text-sm text-slate-500">{prompt.what_it_does?.substring(0, 100)}...</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                        </div>
                    ))}
                    {prompts.length === 0 && <p className="text-slate-500 italic">No prompts in this category yet.</p>}
                </div>
            </div>
        )}

        {/* View 3: Prompt Detail */}
        {!loading && selectedPrompt && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-xl">
                <h1 className="text-3xl font-black mb-6 text-slate-900 dark:text-white">{selectedPrompt.title}</h1>
                
                <div className="space-y-8">
                    <section>
                        <h3 className="text-sm font-bold uppercase text-slate-400 mb-2">What This Prompt Does</h3>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedPrompt.what_it_does}</p>
                    </section>

                    <section className="relative group">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-bold uppercase text-slate-400">The Prompt</h3>
                            <button 
                                onClick={() => handleCopy(selectedPrompt.prompt_content)}
                                className="flex items-center gap-2 text-xs font-bold bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors"
                            >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <div className="bg-gray-50 dark:bg-black p-6 rounded-xl border border-gray-200 dark:border-gray-800 font-mono text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                            {selectedPrompt.prompt_content}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-sm font-bold uppercase text-slate-400 mb-2">How To Use</h3>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedPrompt.how_to_use}</p>
                    </section>

                    {selectedPrompt.example_output_images && selectedPrompt.example_output_images.length > 0 && (
                        <section>
                            <h3 className="text-sm font-bold uppercase text-slate-400 mb-4">Example Output</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {selectedPrompt.example_output_images.map((img, i) => (
                                    <img key={i} src={img} alt="Output" className="rounded-xl border border-gray-200 dark:border-gray-800 w-full h-auto" />
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
