import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Image as ImageIcon, X, Loader2, AlertCircle, Sparkles, Video } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Category } from '../types';
import imageCompression from 'browser-image-compression';
import { motion } from 'framer-motion';

const CATEGORIES: Category[] = ['Couple', 'Kids', 'Men', 'Women', 'Animals', 'Landscape'];

const UploadPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_prompt: '',
    category: 'Men',
    monetization_url: '',
    credit_name: '',
    instagram_handle: '',
  });

  // Cleanup previews to avoid memory leaks
  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

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

  const compressImage = async (file: File) => {
    try {
      const options = {
        maxSizeMB: 0.2, // 200KB
        maxWidthOrHeight: 1920,
        useWebWorker: false, // Safer for compatibility
        fileType: 'image/webp'
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
      // 1. Create Prompt Record
      const { data: prompt, error: promptError } = await supabase
        .from('prompts')
        .insert({
          title: formData.title,
          description: formData.description,
          video_prompt: formData.video_prompt,
          category: formData.category,
          monetization_url: formData.monetization_url,
          credit_name: formData.credit_name,
          instagram_handle: formData.instagram_handle,
          is_published: true,
        })
        .select()
        .single();

      if (promptError) throw promptError;

      // 2. Process and Upload Images
      const totalSteps = files.length;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressedFile = await compressImage(file);
        
        const fileExt = 'webp';
        const fileName = `${prompt.id}/${Date.now()}_${i}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('prompt-images')
          .upload(fileName, compressedFile);

        if (uploadError) {
             console.error("Upload error:", uploadError);
        } else {
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
        className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-800"
      >
        <div className="px-8 py-6 border-b border-gray-100 dark:border-slate-800 bg-sky-500/5">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Upload className="w-6 h-6 text-sky-500" />
            Upload Prompt
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Share your creations with the world. No login required.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Prompt Images <span className="text-red-500">*</span>
            </label>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              {previews.map((src, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group border border-gray-200 dark:border-slate-700">
                  <img src={src} alt="Preview" className="w-full h-full object-cover" />
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
            <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Images will be auto-compressed to &lt;200KB.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                placeholder="e.g., Neon Samurai"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prompt Text <span className="text-red-500">*</span></label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
              placeholder="The exact prompt used to generate the image..."
            />
          </div>

          {/* Video Prompt Section */}
          <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-900/20">
            <label className="block text-sm font-bold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
              <Video className="w-4 h-4" />
              Video Prompt (Optional)
            </label>
            <textarea
              rows={3}
              value={formData.video_prompt}
              onChange={(e) => setFormData({ ...formData, video_prompt: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              placeholder="Add a prompt specifically for video generation (Sora, Veo, etc.)"
            />
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
              This will be shown in a separate section on the details page.
            </p>
          </div>

          <div className="border-t border-gray-100 dark:border-slate-800 pt-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Credits & Monetization (Optional)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Your Name / Credit</label>
                <input
                  type="text"
                  value={formData.credit_name}
                  onChange={(e) => setFormData({ ...formData, credit_name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  placeholder="e.g., Kartik"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Instagram Handle</label>
                <input
                  type="text"
                  value={formData.instagram_handle}
                  onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  placeholder="@username"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monetization / Direct Link</label>
                <input
                  type="url"
                  value={formData.monetization_url}
                  onChange={(e) => setFormData({ ...formData, monetization_url: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                  placeholder="https://your-ad-link.com/..."
                />
              </div>
            </div>
          </div>

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
