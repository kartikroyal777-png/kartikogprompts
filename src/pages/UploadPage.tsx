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
  const [promptType, setPromptType] = useState<'standard' | 'product'>('standard');
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '', 
    video_prompt: '',
    monetization_url: '',
    credit_name: '',
    instagram_handle: '',
    is_paid: false,
    price_credits: 5,
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
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .eq('type', promptType)
        .order('name');

      if (error) throw error;
      if (data && data.length > 0) {
        setCategories(data.map(c => c.name));
        // Default to first category if none selected
        if (selectedCategories.length === 0) {
            setSelectedCategories([data[0].name]);
        }
      } else {
        const defaults = promptType === 'standard' 
            ? ['Couple', 'Kids', 'Men', 'Women', 'Animals', 'Landscape']
            : ['Cosmetics', 'Tech', 'Fashion', 'Food', 'Furniture'];
        setCategories(defaults);
        if (selectedCategories.length === 0) {
            setSelectedCategories([defaults[0]]);
        }
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      // Filter for images only
      const imageFiles = droppedFiles.filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length > 0) {
        const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
        setFiles(prev => [...prev, ...imageFiles]);
        setPreviews(prev => [...prev, ...newPreviews]);
      }
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

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        // Don't allow deselecting the last category
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return alert("Select at least one image.");
    if (selectedCategories.length === 0) return alert("Select at least one category.");
    
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
          category: selectedCategories[0], // Primary category for legacy support
          categories: selectedCategories, // All categories
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
      let firstImagePath = '';

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
        const fileName = `${prompt.id}/${Date.now()}_${i}.${fileExt}`;
        
        if (i === 0) firstImagePath = fileName;

        const { error: uploadError } = await supabase.storage.from('prompt-images').upload(fileName, compressedFile, {
            cacheControl: '3600',
            upsert: true,
            contentType: compressedFile.type
        });

        if (uploadError) throw uploadError;
        
        await supabase.from('prompt_images').insert({
            prompt_id: prompt.id,
            storage_path: fileName,
            order_index: i
        });
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      // 4. Update Main Image Path (CRITICAL FIX)
      if (firstImagePath) {
        await supabase
            .from('prompts')
            .update({ image: firstImagePath })
            .eq('id', prompt.id);
      }

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
        
        <div className="p-8 border-b border-gray-200 dark:border-gray-800">
            <h1 className="text-2xl font-bold mb-6">Upload Prompt</h1>
            <div className="flex bg-gray-100 dark:bg-black p-1 rounded-xl">
                <button 
                    onClick={() => {
                        setPromptType('standard');
                        setSelectedCategories([]);
                    }}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${promptType === 'standard' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-500'}`}
                >
                    <ImageIcon className="w-4 h-4" /> Standard Prompt
                </button>
                <button 
                    onClick={() => {
                        setPromptType('product');
                        setSelectedCategories([]);
                    }}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${promptType === 'product' ? 'bg-white dark:bg-gray-800 shadow-sm' : 'text-gray-500'}`}
                >
                    <Box className="w-4 h-4" /> Product Prompt
                </button>
            </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-4">
            <label className="block text-sm font-bold">Images {promptType === 'product' && <span className="text-xs font-normal text-gray-500">(Auto-compressed for web)</span>}</label>
            
            {/* Drag & Drop Zone */}
            <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "grid grid-cols-4 gap-4 p-4 border-2 border-dashed rounded-xl transition-all",
                    isDragging 
                        ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20" 
                        : "border-gray-200 dark:border-gray-800 hover:border-sky-500 dark:hover:border-sky-500"
                )}
            >
              {previews.map((src, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group bg-gray-100 dark:bg-gray-800">
                  <img src={src} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeFile(idx)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              <label className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-black dark:hover:border-white glow-focus bg-gray-50 dark:bg-gray-800/50 transition-colors">
                <Upload className="h-6 w-6 text-gray-400 mb-2" />
                <span className="text-[10px] text-gray-500 font-bold text-center px-2">Click or Drop</span>
                <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
              </label>

              {files.length === 0 && (
                 <div className="col-span-3 flex items-center justify-center text-gray-400 text-sm italic">
                    Drag and drop images here to upload
                 </div>
              )}
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
            
            {/* Multi-Select Categories */}
            <div>
                <label className="block text-sm font-bold mb-2">Categories (Select Multiple)</label>
                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 min-h-[52px]">
                    {categories.map(cat => {
                        const isSelected = selectedCategories.includes(cat);
                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => toggleCategory(cat)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5",
                                    isSelected
                                        ? "bg-black text-white dark:bg-white dark:text-black border-transparent shadow-sm"
                                        : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400"
                                )}
                            >
                                {isSelected && <Check className="w-3 h-3" />}
                                {cat}
                            </button>
                        );
                    })}
                </div>
            </div>
          </div>

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
