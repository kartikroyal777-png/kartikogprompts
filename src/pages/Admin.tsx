import React, { useState, useEffect } from 'react';
import { Shield, Search, Trash2, Plus, Image as ImageIcon, MessageSquare, ExternalLink, Check, X, Filter, Mail, Clock, Send, Zap, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getImageUrl } from '../lib/utils';
import toast from 'react-hot-toast';
import { CategoryItem } from '../types';

const ADMIN_PASSWORD = 'KARTIK#1234567';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'prompts' | 'mega_prompts' | 'categories' | 'requests'>('prompts');
  
  // Data States
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Category Management
  const [newItemName, setNewItemName] = useState('');
  const [categoryType, setCategoryType] = useState<'standard' | 'super'>('standard');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [availableParents, setAvailableParents] = useState<CategoryItem[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  
  // Stats
  const [pendingCount, setPendingCount] = useState(0);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
        setIsAuthenticated(true);
        toast.success("Welcome back, Admin");
    } else {
        toast.error("Invalid Password");
    }
  };

  const fetchStats = async () => {
      try {
          const { count } = await supabase
            .from('prompt_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
          setPendingCount(count || 0);
      } catch (e) {
          console.error("Error fetching stats", e);
      }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'categories') {
        // Fetch both standard and super categories
        const { data: stdCats } = await supabase.from('categories').select('*').order('name');
        const { data: supCats } = await supabase.from('super_prompt_categories').select('*');
        
        // Normalize
        const formattedStd = (stdCats || []).map(c => ({ ...c, type: c.type || 'standard' }));
        const formattedSup = (supCats || []).map(c => ({ ...c, type: 'super' }));
        
        const allCats = [...formattedStd, ...formattedSup];
        setItems(allCats);
        
        // Filter for parent dropdown (only standard types usually have subcategories in this context)
        setAvailableParents(formattedStd.filter(c => !c.parent_id));
        
      } else if (activeTab === 'requests') {
        const { data } = await supabase
            .from('prompt_requests')
            .select('*')
            .order('created_at', { ascending: false });
        setItems(data || []);
        fetchStats();
      } else if (activeTab === 'mega_prompts') {
        const { data } = await supabase.from('super_prompts').select('*').order('created_at', { ascending: false });
        setItems(data || []);
      } else {
        // Standard Prompts
        let query = supabase.from('prompts').select('*').eq('prompt_type', 'standard').order('created_at', { ascending: false });
        
        if (searchQuery) {
            query = query.limit(100); 
        } else {
            query = query.limit(50);
        }

        const { data } = await query;
        setItems(data || []);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
        fetchData();
        fetchStats();
    }
  }, [isAuthenticated, activeTab, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    
    let table = 'prompts';
    if (activeTab === 'categories') table = 'categories'; 
    if (activeTab === 'requests') table = 'prompt_requests';
    if (activeTab === 'mega_prompts') table = 'super_prompts';

    // Special handling for categories deletion
    if (activeTab === 'categories') {
        const item = items.find(i => i.id === id);
        if (item?.type === 'super') table = 'super_prompt_categories';
    }

    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
        toast.error("Delete failed");
    } else {
        toast.success("Deleted successfully");
        fetchData();
        if (activeTab === 'requests') fetchStats();
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
      const { error } = await supabase.from('prompt_requests').update({ status }).eq('id', id);
      if (error) {
          toast.error("Update failed");
      } else {
          toast.success(`Request marked as ${status}`);
          setItems(prev => prev.map(item => item.id === id ? { ...item, status } : item));
          fetchStats();
      }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName) return;

    let table = 'categories';
    let payload: any = { 
        name: newItemName, 
        type: categoryType,
        parent_id: (categoryType !== 'super' && selectedParentId) ? selectedParentId : null
    };

    if (categoryType === 'super') {
        table = 'super_prompt_categories';
        payload = { name: newItemName, description: 'New Category', sort_order: 99 };
    }

    const { error } = await supabase.from(table).insert(payload);
    if (error) {
        toast.error("Failed to add category: " + error.message);
    } else {
        toast.success("Category added");
        setNewItemName('');
        setSelectedParentId('');
        fetchData();
    }
  };

  const filteredItems = items.filter(item => {
      if (activeTab === 'categories') return true;
      const searchLower = searchQuery.toLowerCase();
      
      if (activeTab === 'requests') {
          const matchesSearch = (
              (item.email && item.email.toLowerCase().includes(searchLower)) ||
              (item.request_details && item.request_details.toLowerCase().includes(searchLower))
          );
          const matchesFilter = requestFilter === 'all' || item.status === requestFilter;
          return matchesSearch && matchesFilter;
      }

      return (
          (item.title && item.title.toLowerCase().includes(searchLower)) ||
          (item.short_id && item.short_id.toString().includes(searchLower)) ||
          (item.id && item.id.includes(searchLower))
      );
  });

  if (!isAuthenticated) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
            <form onSubmit={handleLogin} className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="p-3 bg-black dark:bg-white rounded-full">
                        <Shield className="w-8 h-8 text-white dark:text-black" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold mb-2 text-center text-black dark:text-white">Admin Access</h1>
                <p className="text-gray-500 text-center mb-6 text-sm">Enter secure password to continue</p>
                <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full p-3 border rounded-xl mb-4 dark:bg-black dark:border-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    placeholder="Password"
                />
                <button className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">Login</button>
            </form>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-28 pb-12 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h1 className="text-3xl font-black text-black dark:text-white flex items-center gap-2">
                <Shield className="w-8 h-8" />
                Admin Panel
            </h1>
            <button onClick={() => setIsAuthenticated(false)} className="text-sm font-bold text-red-500 hover:underline">
                Logout
            </button>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {[
                { id: 'prompts', label: 'Standard', icon: ImageIcon },
                { id: 'mega_prompts', label: 'Mega Prompts', icon: Zap },
                { id: 'requests', label: 'Requests', icon: MessageSquare, count: pendingCount },
                { id: 'categories', label: 'Categories', icon: Filter },
            ].map((tab) => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)} 
                    className={`relative flex items-center gap-2 px-5 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
                        activeTab === tab.id 
                            ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg' 
                            : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] text-center">
                            {tab.count}
                        </span>
                    )}
                </button>
            ))}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            {activeTab !== 'categories' && (
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder={activeTab === 'requests' ? "Search by Email or Details..." : "Search by Title or ID..."}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-12 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                </div>
            )}
            
            {activeTab === 'requests' && (
                <div className="flex bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800">
                    {['all', 'pending', 'completed', 'rejected'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setRequestFilter(filter as any)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                                requestFilter === filter 
                                    ? 'bg-black dark:bg-white text-white dark:text-black' 
                                    : 'text-gray-500 hover:text-black dark:hover:text-white'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Content Area */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden min-h-[400px]">
            
            {loading ? (
                <div className="flex items-center justify-center h-64 text-gray-400 animate-pulse">
                    Loading data...
                </div>
            ) : (
                <div className="p-6">
                    {/* Categories View */}
                    {activeTab === 'categories' && (
                        <div>
                            <div className="mb-8 p-6 bg-gray-50 dark:bg-black/50 rounded-2xl border border-gray-200 dark:border-gray-800">
                                <h3 className="font-bold mb-4 text-lg">Add New Category</h3>
                                <form onSubmit={handleAddCategory} className="flex flex-col gap-4">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <input 
                                            value={newItemName}
                                            onChange={e => setNewItemName(e.target.value)}
                                            className="flex-1 p-3 rounded-xl border dark:bg-black dark:border-gray-700 dark:text-white"
                                            placeholder="Category Name"
                                        />
                                        <select 
                                            value={categoryType}
                                            onChange={(e: any) => {
                                                setCategoryType(e.target.value);
                                                setSelectedParentId('');
                                            }}
                                            className="p-3 rounded-xl border dark:bg-black dark:border-gray-700 dark:text-white"
                                        >
                                            <option value="standard">Standard</option>
                                            <option value="super">Mega Prompt</option>
                                        </select>
                                    </div>
                                    
                                    {categoryType !== 'super' && (
                                        <select 
                                            value={selectedParentId}
                                            onChange={(e) => setSelectedParentId(e.target.value)}
                                            className="w-full p-3 rounded-xl border dark:bg-black dark:border-gray-700 dark:text-white"
                                        >
                                            <option value="">No Parent (Main Category)</option>
                                            {availableParents
                                                .filter(p => p.type === categoryType)
                                                .map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))
                                            }
                                        </select>
                                    )}

                                    <button className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 flex items-center justify-center gap-2">
                                        <Plus className="w-5 h-5" /> Add Category
                                    </button>
                                </form>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredItems.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/30 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <div>
                                            <span className="font-bold block flex items-center gap-2">
                                                {item.parent_id && <ChevronRight className="w-4 h-4 text-gray-400" />}
                                                {item.name}
                                            </span>
                                            <span className="text-xs text-gray-500 uppercase">{item.type}</span>
                                        </div>
                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Requests View */}
                    {activeTab === 'requests' && (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredItems.map(item => (
                                <div key={item.id} className="bg-gray-50 dark:bg-black/30 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                    item.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                                                    item.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }`}>
                                                    {item.status}
                                                </span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            
                                            <div>
                                                <a 
                                                    href={`mailto:${item.email}?subject=Your Requested Prompt from OG Prompts&body=Hi there,%0D%0A%0D%0AHere is the prompt you requested:%0D%0A%0D%0A[PASTE PROMPT HERE]%0D%0A%0D%0AEnjoy!%0D%0A- OG Prompts Team`}
                                                    className="flex items-center gap-2 text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline mb-1 w-fit"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                    {item.email}
                                                    <Send className="w-3 h-3 ml-1" />
                                                </a>
                                                <p className="text-gray-600 dark:text-gray-300 bg-white dark:bg-black p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-sm leading-relaxed">
                                                    {item.request_details}
                                                </p>
                                            </div>
                                        </div>

                                        {item.reference_image && (
                                            <div className="flex-shrink-0">
                                                <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Reference</p>
                                                <a href={getImageUrl(item.reference_image)} target="_blank" rel="noreferrer" className="block group relative overflow-hidden rounded-xl w-32 h-32 md:w-48 md:h-48 border border-gray-200 dark:border-gray-700">
                                                    <img src={getImageUrl(item.reference_image)} alt="Ref" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <ExternalLink className="w-6 h-6 text-white" />
                                                    </div>
                                                </a>
                                            </div>
                                        )}

                                        <div className="flex flex-row md:flex-col gap-2 justify-start md:border-l md:pl-6 border-gray-200 dark:border-gray-800">
                                            <button 
                                                onClick={() => handleUpdateStatus(item.id, 'completed')} 
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 font-bold text-sm transition-colors"
                                                title="Mark Completed"
                                            >
                                                <Check className="w-4 h-4" /> <span className="md:hidden">Approve</span>
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(item.id, 'rejected')} 
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/40 font-bold text-sm transition-colors"
                                                title="Mark Rejected"
                                            >
                                                <X className="w-4 h-4" /> <span className="md:hidden">Reject</span>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item.id)} 
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 font-bold text-sm transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" /> <span className="md:hidden">Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Prompts View (Standard, Mega) */}
                    {(activeTab === 'prompts' || activeTab === 'mega_prompts') && (
                        <div className="space-y-2">
                            {filteredItems.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/30 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                                            {item.image && <img src={getImageUrl(item.image)} alt="" className="w-full h-full object-cover" />}
                                            {!item.image && activeTab === 'mega_prompts' && <div className="flex items-center justify-center h-full"><Zap className="w-6 h-6 text-gray-400" /></div>}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white">{item.title}</div>
                                            <div className="text-xs text-gray-500 font-mono flex items-center gap-2">
                                                <span className="bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded">#{item.short_id || item.id.substring(0,6)}</span>
                                                <span>{item.category}</span>
                                                {item.is_paid && <span className="text-amber-500 flex items-center gap-0.5"><Lock className="w-3 h-3" /> Premium</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {filteredItems.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                            <p>No items found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
