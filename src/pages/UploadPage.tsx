import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Image as ImageIcon, X, Loader2, Coins, Layers, Check, Box, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const UploadPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [promptTexts, setPromptTexts] = useState<string[]>(['']);
  
  // New: Prompt Type Selection
  const [promptType, setPromptType] = useState<'standard' | 'product'>('standard');

  const [formData, setFormData] = useState({
    title: '',
    description: '', 
    video_prompt: '',
    monetization_url: '',
    credit_name: '',
    instagram_handle: '',
    is_paid: false,
    price_credits: 5, // Default price
    is_bundle: false,
    instructions: '' // New for Product Prompts
  });

  useEffect(() => {
    if (profile && !profile.creator_badge) {
      navigate('/become-creator');
    }
    fetchCategories();
  }, [profile, promptType]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .eq('type', promptType)
        .order('name');

      if (error) throw error;
      if (data && data.length > 0) {
        setCategories(data.map(c => c.name));
        setSelectedCategories([data[0].name]);
      } else {
        const defaults = promptType === 'standard' 
            ? ['Couple', 'Kids', 'Men', 'Women', 'Animals', 'Landscape']
            : ['Cosmetics', 'Tech', 'Fashion', 'Food', 'Furniture'];
        setCategories(defaults);
        setSelectedCategories([defaults[0]]);
      }
    } catch (err) {
      console.error("Error fetching categories", err);
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
    setPreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index]);
      return newPreviews.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return alert("Select at least one image.");
    
    setLoading(true);
    setUploadProgress(0);

    try {
      // 1. Create Prompt Record
      const { data: prompt, error: promptError } = await supabase
        .from('prompts')
        .insert({
          title: formData.title,
          description: formData.description || (promptType === 'product' ? formData.instructions : promptTexts[0]),
          video_prompt: formData.video_prompt,
          category: selectedCategories[0],
          categories: selectedCategories,
          monetization_url: formData.monetization_url,
          credit_name: formData.credit_name || profile?.display_name,
          instagram_handle: formData.instagram_handle,
          is_published: true,
          creator_id: user?.id,
          is_paid: formData.is_paid,
          price_credits: formData.is_paid ? formData.price_credits : null,
          is_bundle: files.length > 1,
          prompt_type: promptType
        })
        .select()
        .single();

      if (promptError) throw promptError;

      // 2. Insert Content
      const bundleData = promptTexts.map((text, idx) => ({ index: idx, text }));
      await supabase.from('prompt_contents').insert({
        prompt_id: prompt.id,
        full_text: promptTexts[0],
        bundle_data: bundleData
      });

      // 3. Upload Images
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const options = promptType === 'product' 
            ? { maxSizeMB: 0.08, maxWidthOrHeight: 1024, useWebWorker: true, fileType: 'image/webp' }
            : { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true };

        let compressedFile = file;
        try {
            compressedFile = await imageCompression(file, options);
        } catch (e) {
            console.warn("Compression failed, using original", e);
        }
        
        const fileExt = compressedFile.type.split('/')[1] || 'webp';
        // Use prompt ID in path to keep it organized
        const fileName = `${prompt.id}/${Date.now()}_${i}.${fileExt}`;
        
        // CRITICAL FIX: Add Content-Type to ensure browser renders it as image
        const { error: uploadError } = await supabase.storage.from('prompt-images').upload(fileName, compressedFile, {
            cacheControl: '3600',
            upsert: true,
            contentType: compressedFile.type
        });

        if (uploadError) {
            console.error("Upload failed for file " + i, uploadError);
            throw uploadError;
        }
        
        await supabase.from('prompt_images').insert({
            prompt_id: prompt.id,
            storage_path: fileName,
            order_index: i
        });
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      // Removed updating the 'image' column in prompts table to avoid errors if column is missing/protected
      // The app will now rely on prompt_images table

      navigate(promptType === 'product' ? '/product-prompts' : '/prompts');
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-28 pb-12 px-4">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800">
        
        {/* Type Selection Header */}
        <div className="p-8 border-b border-gray-200 dark:border-gray-800">
            <h1 className="text-2xl font-bold mb-6">Upload Prompt</h1>
            <div className="flex bg-gray-100 dark:bg-black p-1 rounded-xl">
                <button 
                    onClick={() => setPromptType('standard')}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${promptType === 'standard' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-500'}`}
                >
                    <ImageIcon className="w-4 h-4" /> Standard Prompt
                </button>
                <button 
                    onClick={() => setPromptType('product')}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${promptType === 'product' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-500'}`}
                >
                    <Box className="w-4 h-4" /> Product Prompt
                </button>
            </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Image Upload - Fixed Visibility */}
          <div className="space-y-4">
            <label className="block text-sm font-bold">Images {promptType === 'product' && <span className="text-xs font-normal text-gray-500">(Auto-compressed for web)</span>}</label>
            <div className="grid grid-cols-4 gap-4">
              {previews.map((src, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group bg-gray-100 dark:bg-gray-800">
                  <img src={src} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeFile(idx)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-black dark:hover:border-white glow-focus bg-gray-50 dark:bg-gray-800/50 transition-colors">
                <Upload className="h-6 w-6 text-gray-400" />
                <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
              </label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none glow-focus"
              />
            </div>
            <div>
                <label className="block text-sm font-bold mb-2">Category</label>
                <select 
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 glow-focus"
                    onChange={(e) => setSelectedCategories([e.target.value])}
                >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
          </div>

          {/* Premium Option - Restored */}
          <div className="flex flex-col gap-4 p-4 bg-gray-50 dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Premium Prompt</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Earn credits when users unlock this.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.is_paid} 
                  onChange={e => setFormData({...formData, is_paid: e.target.checked})} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {formData.is_paid && (
              <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-bold mb-2">Price (Credits)</label>
                <div className="relative">
                  <Coins className="absolute left-3 top-3 w-5 h-5 text-amber-500" />
                  <input 
                    type="number" 
                    min="1" 
                    value={formData.price_credits} 
                    onChange={e => setFormData({...formData, price_credits: parseFloat(e.target.value)})} 
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Product Specific Fields */}
          {promptType === 'product' && (
             <div>
                <label className="block text-sm font-bold mb-2">Instructions (Optional)</label>
                <textarea
                  rows={3}
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 outline-none glow-focus"
                  placeholder="Instructions for using this product prompt..."
                />
             </div>
          )}

          {/* Prompt Text */}
          <div>
            <label className="block text-sm font-bold mb-2">Prompt Text</label>
            <textarea
                required
                rows={4}
                value={promptTexts[0]}
                onChange={(e) => {
                    const newTexts = [...promptTexts];
                    newTexts[0] = e.target.value;
                    setPromptTexts(newTexts);
                }}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 outline-none glow-focus"
                placeholder="Enter the main prompt..."
            />
          </div>

          {/* Video Prompt */}
          <div>
            <label className="block text-sm font-bold mb-2">Video Prompt (Optional)</label>
            <textarea
                rows={2}
                value={formData.video_prompt}
                onChange={(e) => setFormData({ ...formData, video_prompt: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 outline-none glow-focus"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-lg rounded-xl hover:opacity-90 flex items-center justify-center gap-2 glow-button"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Submit Prompt'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadPage;
