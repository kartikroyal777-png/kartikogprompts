import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Image as ImageIcon, X, Loader2, Coins, Layers } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Category } from '../types';
import imageCompression from 'browser-image-compression';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const CATEGORIES: Category[] = ['Couple', 'Kids', 'Men', 'Women', 'Animals', 'Landscape'];

const UploadPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Dynamic prompts for bundles
  const [promptTexts, setPromptTexts] = useState<string[]>(['']);

  const [formData, setFormData] = useState({
    title: '',
    description: '', // Preview text for paid
    full_text: '',   // Main prompt text (for single image)
    video_prompt: '',
    category: 'Men',
    monetization_url: '',
    credit_name: '',
    instagram_handle: '',
    is_paid: false,
    price_credits: 0.5,
    is_bundle: false
  });

  useEffect(() => {
    if (profile && !profile.creator_badge) {
      navigate('/become-creator');
    }
  }, [profile]);

  // Cleanup previews
  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  // Auto-enable bundle if > 1 image
  useEffect(() => {
    const isMultiple = files.length > 1;
    setFormData(prev => ({ ...prev, is_bundle: isMultiple }));
    
    // Adjust prompt text array size
    setPromptTexts(prev => {
      const newTexts = [...prev];
      if (files.length > newTexts.length) {
        // Add empty strings for new images
        return [...newTexts, ...Array(files.length - newTexts.length).fill('')];
      } else if (files.length < newTexts.length && files.length > 0) {
        // Trim if fewer images (keep at least 1)
        return newTexts.slice(0, files.length);
      }
      return newTexts;
    });
  }, [files.length]);

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
    setPromptTexts(prev => prev.filter((_, i) => i !== index));
  };

  const handlePromptTextChange = (index: number, value: string) => {
    setPromptTexts(prev => {
      const newTexts = [...prev];
      newTexts[index] = value;
      return newTexts;
    });
    // Sync first text with main full_text for backward compatibility
    if (index === 0) {
      setFormData(prev => ({ ...prev, full_text: value }));
    }
  };

  const compressImage = async (file: File) => {
    try {
      const options = {
        maxSizeMB: 0.07,
        maxWidthOrHeight: 1280,
        useWebWorker: false,
        fileType: 'image/webp',
        initialQuality: 0.7
      };
      return await imageCompression(file, options);
    } catch (error) {
      console.warn("Compression failed, using original file", error);
      return file;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      alert("Please select at least one image.");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const promptDescription = formData.is_paid 
        ? (formData.description || "Unlock to see the full prompt.") 
        : (formData.is_bundle ? "View bundle for details." : promptTexts[0]);

      // 1. Create Prompt Record
      const { data: prompt, error: promptError } = await supabase
        .from('prompts')
        .insert({
          title: formData.title,
          description: promptDescription,
          video_prompt: formData.video_prompt,
          category: formData.category,
          monetization_url: formData.monetization_url,
          credit_name: formData.credit_name || profile?.display_name,
          instagram_handle: formData.instagram_handle,
          is_published: true,
          creator_id: user?.id,
          is_paid: formData.is_paid,
          price_credits: formData.is_paid ? formData.price_credits : null,
          is_bundle: formData.is_bundle
        })
        .select()
        .single();

      if (promptError) throw promptError;

      // 2. Insert Content (Secure)
      if (formData.is_paid) {
        const bundleData = promptTexts.map((text, idx) => ({ index: idx, text }));
        
        const { error: contentError } = await supabase
          .from('prompt_contents')
          .insert({
            prompt_id: prompt.id,
            full_text: promptTexts[0], // Main text
            bundle_data: bundleData // All texts
          });
          
        if (contentError) throw contentError;
      }

      // 3. Upload Images
      const totalSteps = files.length;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressedFile = await compressImage(file);
        
        const fileExt = 'webp';
        const fileName = `${prompt.id}/${Date.now()}_${i}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('prompt-images')
          .upload(fileName, compressedFile);

        if (uploadError) console.error("Upload error:", uploadError);
        else {
            await supabase
            .from('prompt_images')
            .insert({
                prompt_id: prompt.id,
                storage_path: fileName,
                thumbnail_path: fileName,
                width: 0,
                height: 0,
                order_index: i
            });
        }
        setUploadProgress(((i + 1) / totalSteps) * 100);
      }

      navigate('/prompts');
    } catch (error: any) {
      console.error("Submission error:", error);
      alert('Error uploading: ' + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pt-28 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-800"
      >
        <div className="px-8 py-6 border-b border-gray-100 dark:border-slate-800 bg-sky-500/5">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Upload className="w-6 h-6 text-sky-500" />
            Upload Prompt
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Image Upload */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Prompt Images <span className="text-red-500">*</span>
            </label>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {previews.map((src, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group border border-gray-200 dark:border-slate-700">
                  <img src={src} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1.5 rounded">
                    {idx + 1}
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              <label className="relative aspect-square cursor-pointer rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 transition-colors flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-800/50">
                <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Add Image</span>
                <input type="file" className="sr-only" accept="image/*" multiple onChange={handleFileChange} />
              </label>
            </div>
            {formData.is_bundle && (
              <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/10 p-2 rounded-lg">
                <Layers className="w-4 h-4" />
                Bundle Mode Activated: Multiple images detected.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                placeholder="e.g., Neon Samurai"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20">
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-300">
                <Coins className="w-4 h-4" />
                Premium Prompt?
              </label>
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
              <div>
                <label className="block text-xs font-medium text-amber-800 dark:text-amber-400 mb-1">Price (Credits)</label>
                <input
                  type="number"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={formData.price_credits}
                  onChange={e => setFormData({...formData, price_credits: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            )}
          </div>

          {/* Dynamic Prompt Inputs */}
          <div className="space-y-4">
            {promptTexts.map((text, idx) => (
              <div key={idx}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {formData.is_bundle ? `Prompt for Image ${idx + 1}` : 'Prompt Text'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={text}
                  onChange={(e) => handlePromptTextChange(idx, e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder={formData.is_paid ? "Hidden until unlocked..." : "Enter prompt..."}
                />
              </div>
            ))}
          </div>

          {formData.is_paid && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Preview Text (Public)
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                placeholder="A teaser description..."
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading... {Math.round(uploadProgress)}%
              </>
            ) : (
              'Submit Prompt'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default UploadPage;
