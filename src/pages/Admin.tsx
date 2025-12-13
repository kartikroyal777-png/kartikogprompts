import React, { useState, useEffect } from 'react';
import { Shield, Lock, Search, Trash2, AlertTriangle, Check, RefreshCw, DollarSign, Clock, List, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Prompt, PayoutRequest } from '../types';

const ADMIN_PASSWORD = 'KARTIK#1234567';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'prompts' | 'payouts' | 'categories'>('prompts');
  
  // Prompts State
  const [searchId, setSearchId] = useState('');
  const [searchResults, setSearchResults] = useState<Prompt[]>([]);
  const [searching, setSearching] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Payouts State
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);

  // Categories State
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
      fetchPayouts(); // Fetch payouts on login
    } else {
      setError('Invalid password');
    }
  };

  // --- Categories Logic ---
  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      const { error } = await supabase.from('categories').insert({ name: newCategory.trim() });
      if (error) throw error;
      
      setNewCategory('');
      fetchCategories();
      alert('Category added!');
    } catch (err: any) {
      alert('Error adding category: ' + err.message);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;

    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      
      fetchCategories();
    } catch (err: any) {
      alert('Error deleting category: ' + err.message);
    }
  };

  // --- Payouts Logic ---
  const fetchPayouts = async () => {
    setLoadingPayouts(true);
    try {
      const { data, error } = await supabase
        .from('payout_requests')
        .select(`
          *,
          profiles:creator_id (display_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to flatten profile info
      const formatted = (data || []).map((p: any) => ({
        ...p,
        creator_name: p.profiles?.display_name || 'Unknown'
      }));

      setPayouts(formatted);
    } catch (err) {
      console.error("Error fetching payouts", err);
    } finally {
      setLoadingPayouts(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    if (!confirm("Mark this request as PAID? Ensure you have transferred the funds.")) return;
    
    try {
      const { error } = await supabase
        .from('payout_requests')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'paid' } : p));
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // --- Prompts Logic ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setSearching(true);
    setSearchResults([]);

    try {
      let query = supabase
        .from('prompts')
        .select(`
          *,
          images:prompt_images(storage_path, order_index)
        `);

      const isNumeric = /^\d+$/.test(searchId);

      if (isNumeric) {
        query = query.eq('short_id', parseInt(searchId));
      } else {
        query = query.filter('id::text', 'ilike', `${searchId}%`);
      }

      const { data, error } = await query.limit(10);

      if (error) throw error;

      const formattedPrompts: Prompt[] = (data || []).map((p: any) => {
         const imagesList = (p.images || [])
            .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
            .map((img: any) => {
                if (img.storage_path.startsWith('http')) return img.storage_path;
                return supabase.storage.from('prompt-images').getPublicUrl(img.storage_path).data.publicUrl;
            });

        return {
          id: p.id,
          short_id: p.short_id,
          promptId: p.short_id ? p.short_id.toString() : p.id.substring(0, 5),
          title: p.title,
          description: p.description,
          author: p.credit_name || 'Admin',
          category: p.category,
          likes: p.likes_count || 0,
          image: imagesList[0] || p.image || 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/600x800?text=No+Image',
          images: imagesList,
          monetization_url: p.monetization_url
        };
      });

      setSearchResults(formattedPrompts);
    } catch (err: any) {
      console.error('Search error:', err);
      alert('Error searching: ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) return;

    setDeleting(id);
    try {
      const { data: images } = await supabase.from('prompt_images').select('storage_path').eq('prompt_id', id);
      if (images && images.length > 0) {
        const paths = images.map(img => img.storage_path);
        await supabase.storage.from('prompt-images').remove(paths);
      }

      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSearchResults(prev => prev.filter(p => p.id !== id));
      alert('Prompt deleted successfully');
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('Error deleting: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-slate-800">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4 text-red-600 dark:text-red-400">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Access</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Enter password to manage prompts</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="Enter admin password"
                />
              </div>
            </div>
            
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}

            <button
              type="submit"
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
            >
              Access Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-28 pb-12 px-4 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-600" />
            Admin Panel
          </h1>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="text-sm text-slate-500 hover:text-red-500"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('prompts')}
            className={`pb-4 px-4 font-bold text-sm transition-colors relative whitespace-nowrap ${
              activeTab === 'prompts' 
                ? 'text-sky-500' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Manage Prompts
            {activeTab === 'prompts' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />}
          </button>
          <button
            onClick={() => { setActiveTab('payouts'); fetchPayouts(); }}
            className={`pb-4 px-4 font-bold text-sm transition-colors relative whitespace-nowrap ${
              activeTab === 'payouts' 
                ? 'text-sky-500' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Payout Requests
            {activeTab === 'payouts' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />}
          </button>
          <button
            onClick={() => { setActiveTab('categories'); fetchCategories(); }}
            className={`pb-4 px-4 font-bold text-sm transition-colors relative whitespace-nowrap ${
              activeTab === 'categories' 
                ? 'text-sky-500' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Manage Categories
            {activeTab === 'categories' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />}
          </button>
        </div>

        {/* --- PROMPTS TAB --- */}
        {activeTab === 'prompts' && (
          <>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-800 p-6 mb-8">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Find & Delete Prompts</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Enter the 5-digit Prompt ID (e.g., "10010") to find and remove inappropriate content.
              </p>

              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="Enter ID (e.g. 10001)..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Search'}
                </button>
              </form>
            </div>

            <div className="space-y-4">
              {searchResults.map((prompt) => (
                <div key={prompt.id} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <img src={prompt.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-xs font-bold rounded">
                        ID: {prompt.promptId}
                      </span>
                      <span className="text-xs text-slate-400 font-mono truncate max-w-[150px]">{prompt.id}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white truncate">{prompt.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{prompt.description}</p>
                  </div>

                  <button
                    onClick={() => handleDelete(prompt.id)}
                    disabled={deleting === prompt.id}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-medium text-sm whitespace-nowrap"
                  >
                    {deleting === prompt.id ? 'Deleting...' : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* --- PAYOUTS TAB --- */}
        {activeTab === 'payouts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Withdrawal Requests</h2>
              <button onClick={fetchPayouts} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
                <RefreshCw className={`w-4 h-4 ${loadingPayouts ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {payouts.length === 0 && !loadingPayouts && (
              <div className="text-center py-12 text-slate-500">No payout requests found.</div>
            )}

            {payouts.map((request) => (
              <div key={request.id} className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-gray-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase ${
                      request.status === 'paid' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {request.status}
                    </span>
                    <span className="text-xs text-slate-400">{new Date(request.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                    ${request.usd_converted} USD 
                    <span className="text-sm font-normal text-slate-500 ml-2">({request.credits_requested} Credits)</span>
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Creator: <span className="font-medium">{request.creator_name}</span>
                  </p>
                  <div className="mt-2 p-2 bg-gray-50 dark:bg-slate-950 rounded border border-gray-100 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400 break-all">
                    {request.payout_ref}
                  </div>
                </div>

                {request.status === 'pending' && (
                  <button
                    onClick={() => handleMarkPaid(request.id)}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Mark Paid
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* --- CATEGORIES TAB --- */}
        {activeTab === 'categories' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-800 p-6 mb-8">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add New Category</h2>
              <form onSubmit={handleAddCategory} className="flex gap-4">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="Category Name (e.g. 'Abstract')"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </form>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white">Existing Categories</h3>
                <button onClick={fetchCategories} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
                  <RefreshCw className={`w-4 h-4 ${loadingCategories ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{cat.name}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {categories.length === 0 && !loadingCategories && (
                  <div className="p-8 text-center text-slate-500">No categories found.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
