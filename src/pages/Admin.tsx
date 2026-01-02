import React, { useState, useEffect } from 'react';
import { Shield, Lock, Search, Trash2, Plus, Box, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Prompt } from '../types';

const ADMIN_PASSWORD = 'KARTIK#1234567';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'prompts' | 'product_prompts' | 'categories'>('prompts');
  
  // Data States
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [categoryType, setCategoryType] = useState<'standard' | 'product'>('standard');
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) setIsAuthenticated(true);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'categories') {
        const { data } = await supabase.from('categories').select('*').order('type').order('name');
        setItems(data || []);
      } else {
        const type = activeTab === 'product_prompts' ? 'product' : 'standard';
        let query = supabase.from('prompts').select('*').eq('prompt_type', type).order('created_at', { ascending: false });
        
        // Note: For large datasets, search should be server-side. 
        // Here we fetch limit 50 and filter client side for simplicity unless search is active
        if (searchQuery) {
            // Basic search implementation
            // Supabase text search or simple ilike
            // We'll fetch more if searching
            query = query.limit(100); 
        } else {
            query = query.limit(50);
        }

        const { data } = await query;
        setItems(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, activeTab, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const table = activeTab === 'categories' ? 'categories' : 'prompts';
    await supabase.from(table).delete().eq('id', id);
    fetchData();
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName) return;

    await supabase.from('categories').insert({ name: newItemName, type: categoryType });
    setNewItemName('');
    fetchData();
  };

  const filteredItems = items.filter(item => {
      if (activeTab === 'categories') return true;
      const searchLower = searchQuery.toLowerCase();
      return (
          (item.title && item.title.toLowerCase().includes(searchLower)) ||
          (item.short_id && item.short_id.toString().includes(searchLower)) ||
          (item.id && item.id.includes(searchLower))
      );
  });

  if (!isAuthenticated) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
            <form onSubmit={handleLogin} className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
                <h1 className="text-2xl font-bold mb-4">Admin Access</h1>
                <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full p-2 border rounded mb-4 dark:bg-black dark:border-gray-700"
                    placeholder="Password"
                />
                <button className="w-full bg-black dark:bg-white text-white dark:text-black py-2 rounded font-bold">Login</button>
            </form>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-28 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
        
        <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
            <button onClick={() => setActiveTab('prompts')} className={`pb-4 px-4 font-bold whitespace-nowrap ${activeTab === 'prompts' ? 'border-b-2 border-black dark:border-white' : 'text-gray-500'}`}>Standard Prompts</button>
            <button onClick={() => setActiveTab('product_prompts')} className={`pb-4 px-4 font-bold whitespace-nowrap ${activeTab === 'product_prompts' ? 'border-b-2 border-black dark:border-white' : 'text-gray-500'}`}>Product Prompts</button>
            <button onClick={() => setActiveTab('categories')} className={`pb-4 px-4 font-bold whitespace-nowrap ${activeTab === 'categories' ? 'border-b-2 border-black dark:border-white' : 'text-gray-500'}`}>Categories</button>
        </div>

        {/* Search Bar for Prompts */}
        {activeTab !== 'categories' && (
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search by Title or ID..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 p-3 rounded-xl border dark:bg-gray-900 dark:border-gray-800"
                />
            </div>
        )}

        {/* Category Add Form */}
        {activeTab === 'categories' && (
            <div className="mb-8 p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <h3 className="font-bold mb-4">Add New Category</h3>
                <form onSubmit={handleAddCategory} className="flex flex-col md:flex-row gap-4">
                    <input 
                        value={newItemName}
                        onChange={e => setNewItemName(e.target.value)}
                        className="flex-1 p-3 rounded-xl border dark:bg-black dark:border-gray-700"
                        placeholder="Category Name"
                    />
                    <select 
                        value={categoryType}
                        onChange={(e: any) => setCategoryType(e.target.value)}
                        className="p-3 rounded-xl border dark:bg-black dark:border-gray-700"
                    >
                        <option value="standard">Standard</option>
                        <option value="product">Product</option>
                    </select>
                    <button className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold">Add</button>
                </form>
            </div>
        )}

        <div className="space-y-4">
            {filteredItems.map(item => (
                <div key={item.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <div>
                        <div className="font-bold">{item.title || item.name}</div>
                        <div className="text-xs text-gray-500">
                            {item.short_id ? `#${item.short_id}` : item.id.substring(0,8)} • {item.type || item.prompt_type}
                            {item.category && ` • ${item.category}`}
                        </div>
                    </div>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
            ))}
            {filteredItems.length === 0 && <div className="text-center text-gray-500 py-8">No items found.</div>}
        </div>
      </div>
    </div>
  );
}
