import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Image as ImageIcon, X, Loader2, Coins, Layers, Check, Box, Lock, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const UploadPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [promptTexts, setPromptTexts] = useState<string[]>(['']);
  const [promptType, setPromptType] = useState<'standard' | 'product' | 'super'>('standard');
  const [isDragging, setIsDragging] = useState(false);

  // Super Prompt specific fields
  const [superData, setSuperData] = useState({
    what_it_does: '',
    how_to_use: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '', 
    video_prompt: '',
    monetization_url: '',
    credit_name: '',
    instagram_handle: '',
    is_paid: false,
    is_bundle: false,
    instructions: ''
  });

  useEffect(() => {
    if (profile && !profile.creator_badge) {
      navigate('/become-creator');
    }
    fetchCategories();
  }, [profile, promptType]);

  const fetchCategories = async () => {
    try {
      if (promptType === 'super') {
          const { data } = await supabase.from('super_prompt_categories').select('name, id');
          if (data) setCategories(data.map(c => c.name)); 
      } else {
          const { data } = await supabase.from('categories').select('name').eq('type', promptType);
          if (data) setCategories(data.map(c => c.name));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setFiles(prev => [...prev, ...newFiles]);
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const toggleCategory = (category: string) => {
    // For Super Prompts, allow only one category for simplicity now
    if (promptType === 'super') {
        setSelectedCategories([category]);
        return;
    }
    setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        // Handle Super Prompt Upload
        if (promptType === 'super') {
            // Logic to get category ID
            const { data: catData } = await supabase.from('super_prompt_categories').select('id').eq('name', selectedCategories[0]).single();
            if (!catData) throw new Error("Invalid Category");

            // Upload images
            const imageUrls: string[] = [];
            for (const file of files) {
                const fileName = `super/${Date.now()}_${file.name}`;
                await supabase.storage.from('prompt-images').upload(fileName, file);
                const { data } = supabase.storage.from('prompt-images').getPublicUrl(fileName);
                imageUrls.push(data.publicUrl);
            }

            await supabase.from('super_prompts').insert({
                title: formData.title,
                category_id: catData.id,
                what_it_does: superData.what_it_does,
                prompt_content: promptTexts[0],
                how_to_use: superData.how_to_use,
                example_output_images: imageUrls,
                created_by: user?.id,
                is_premium: formData.is_paid
            });
            navigate('/super-prompts');
            return;
        }

        // Standard/Product Logic
        // Upload main image
        let mainImageUrl = null;
        if (files.length > 0) {
            const file = files[0];
            const fileName = `prompts/${Date.now()}_${file.name}`;
            await supabase.storage.from('prompt-images').upload(fileName, file);
            const { data } = supabase.storage.from('prompt-images').getPublicUrl(fileName);
            mainImageUrl = data.publicUrl;
        }

        const { data: prompt, error: promptError } = await supabase
        .from('prompts')
        .insert({
          title: formData.title,
          description: formData.description || promptTexts[0],
          video_prompt: formData.video_prompt,
          category: selectedCategories[0],
          categories: selectedCategories,
          monetization_url: formData.monetization_url,
          credit_name: formData.credit_name || profile?.display_name,
          instagram_handle: formData.instagram_handle,
          is_published: true,
          creator_id: user?.id,
          is_paid: formData.is_paid,
          is_bundle: files.length > 1,
          prompt_type: promptType,
          image: mainImageUrl
        })
        .select()
        .single();

        if (promptError) throw promptError;

        // Upload additional images and link
        if (files.length > 0) {
             for (let i = 0; i < files.length; i++) {
                 const file = files[i];
                 const fileName = `prompts/${prompt.id}_${i}_${file.name}`;
                 await supabase.storage.from('prompt-images').upload(fileName, file);
                 // We store the relative path for prompt_images table usually, or full URL
                 // Using storage path as per existing schema logic
                 await supabase.from('prompt_images').insert({
                     prompt_id: prompt.id,
                     storage_path: fileName,
                     order_index: i
                 });
             }
        }

        // Insert Content
        await supabase.from('prompt_contents').insert({
            prompt_id: prompt.id,
            full_text: promptTexts[0],
            bundle_data: promptTexts.map((text, i) => ({ index: i, text }))
        });
        
        navigate('/prompts');

    } catch (error: any) {
        alert(error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-28 pb-12 px-4">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 border border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Upload Prompt</h1>
        
        {/* Type Switcher */}
        <div className="flex bg-gray-100 dark:bg-black p-1 rounded-xl mb-8">
            {['standard', 'product', 'super'].map(t => (
                <button 
                    key={t}
                    onClick={() => { setPromptType(t as any); setSelectedCategories([]); }}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm capitalize transition-all ${promptType === t ? 'bg-white dark:bg-gray-800 shadow-sm text-black dark:text-white' : 'text-gray-500'}`}
                >
                    {t}
                </button>
            ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Common Fields */}
            <div>
                <label className="block text-sm font-bold mb-2 text-slate-900 dark:text-white">Title</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {/* Super Prompt Specifics */}
            {promptType === 'super' && (
                <>
                    <div>
                        <label className="block text-sm font-bold mb-2 text-slate-900 dark:text-white">What This Prompt Does</label>
                        <textarea value={superData.what_it_does} onChange={e => setSuperData({...superData, what_it_does: e.target.value})} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 text-slate-900 dark:text-white" rows={3} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2 text-slate-900 dark:text-white">How To Use</label>
                        <textarea value={superData.how_to_use} onChange={e => setSuperData({...superData, how_to_use: e.target.value})} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 text-slate-900 dark:text-white" rows={3} />
                    </div>
                </>
            )}

            {/* Main Prompt Content */}
            <div>
                <label className="block text-sm font-bold mb-2 text-slate-900 dark:text-white">Prompt Content</label>
                <textarea required value={promptTexts[0]} onChange={e => setPromptTexts([e.target.value])} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 font-mono text-sm text-slate-900 dark:text-white" rows={6} />
            </div>

            {/* Categories */}
            <div>
                <label className="block text-sm font-bold mb-2 text-slate-900 dark:text-white">Categories</label>
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <button type="button" key={cat} onClick={() => toggleCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${selectedCategories.includes(cat) ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-transparent border-gray-200 dark:border-gray-800 text-slate-500'}`}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Images */}
            <div>
                <label className="block text-sm font-bold mb-2 text-slate-900 dark:text-white">Images</label>
                <div className="grid grid-cols-4 gap-4">
                    {previews.map((src, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                            <img src={src} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                        </div>
                    ))}
                    <label className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <Upload className="w-6 h-6 text-gray-400" />
                        <input type="file" hidden multiple accept="image/*" onChange={handleFileChange} />
                    </label>
                </div>
            </div>

            {/* Premium Toggle */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800">
                <Lock className="w-5 h-5 text-amber-500" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">Premium Content</span>
                <div className="ml-auto">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={formData.is_paid} onChange={e => setFormData({...formData, is_paid: e.target.checked})} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>

            {/* Affiliate Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-bold text-sm text-blue-700 dark:text-blue-300">Creator Commission</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                    When users upgrade to Pro via your premium prompt, you earn 50% commission (10 Credits).
                </p>
            </div>

            <button disabled={loading} className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-opacity">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Upload'}
            </button>
        </form>
      </div>
    </div>
  );
};

export default UploadPage;
