import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Image as ImageIcon, X, Loader2, Lock, Zap, Shirt, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { BuyLookLink } from '../types';

const UploadPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Main Images
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  // Input Images (Optional)
  const [inputFiles, setInputFiles] = useState<File[]>([]);
  const [inputPreviews, setInputPreviews] = useState<string[]>([]);

  // Mega Prompt Thumbnail (Optional)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [promptTexts, setPromptTexts] = useState<string[]>(['']);
  const [promptType, setPromptType] = useState<'standard' | 'super'>('standard');
  
  // Drag states
  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDraggingInput, setIsDraggingInput] = useState(false);

  // Super Prompt specific fields
  const [superData, setSuperData] = useState({
    what_it_does: '',
    how_to_use: ''
  });

  // Buy This Look Links
  const [buyLinks, setBuyLinks] = useState<BuyLookLink[]>([{ title: '', url: '' }]);

  const [formData, setFormData] = useState({
    title: '',
    description: '', 
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
          // Fetch main categories only (no parents)
          const { data } = await supabase.from('categories').select('name').eq('type', 'standard').is('parent_id', null);
          if (data) setCategories(data.map(c => c.name));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isInputImage = false) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files), isInputImage);
    }
  };

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setThumbnailFile(file);
          setThumbnailPreview(URL.createObjectURL(file));
      }
  };

  const handleDragOver = (e: React.DragEvent, isInputImage: boolean) => {
    e.preventDefault();
    if (isInputImage) setIsDraggingInput(true);
    else setIsDraggingMain(true);
  };

  const handleDragLeave = (e: React.DragEvent, isInputImage: boolean) => {
    e.preventDefault();
    if (isInputImage) setIsDraggingInput(false);
    else setIsDraggingMain(false);
  };

  const handleDrop = async (e: React.DragEvent, isInputImage: boolean) => {
    e.preventDefault();
    if (isInputImage) setIsDraggingInput(false);
    else setIsDraggingMain(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await processFiles(Array.from(e.dataTransfer.files), isInputImage);
    }
  };

  const processFiles = async (fileList: File[], isInputImage: boolean) => {
    // Updated Compression: Target ~100-150KB
    const compressionOptions = {
        maxSizeMB: 0.15, 
        maxWidthOrHeight: 1280, 
        useWebWorker: false, // FIX: Disabled WebWorker to prevent "t._onTimeout" errors
        fileType: 'image/jpeg',
        initialQuality: 0.7 
    };

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of fileList) {
        if (!file.type.startsWith('image/')) continue;

        try {
            // Apply compression
            const compressed = await imageCompression(file, compressionOptions);
            newFiles.push(compressed);
            newPreviews.push(URL.createObjectURL(compressed));
        } catch (err) {
            console.warn("Compression failed for", file.name, err);
            newFiles.push(file);
            newPreviews.push(URL.createObjectURL(file));
        }
    }
    
    if (isInputImage) {
        if (promptType !== 'super') {
            // Standard: Only 1 input image allowed. Replace existing.
            if (newFiles.length > 0) {
                setInputFiles([newFiles[0]]);
                setInputPreviews([newPreviews[0]]);
            }
        } else {
            // Super Prompts: Allow multiple
            setInputFiles(prev => [...prev, ...newFiles]);
            setInputPreviews(prev => [...prev, ...newPreviews]);
        }
    } else {
        setFiles(prev => [...prev, ...newFiles]);
        setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number, isInputImage = false) => {
    if (isInputImage) {
        setInputFiles(prev => prev.filter((_, i) => i !== index));
        setInputPreviews(prev => prev.filter((_, i) => i !== index));
    } else {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  const toggleCategory = (category: string) => {
    if (promptType === 'super') {
        setSelectedCategories([category]);
        return;
    }
    setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };

  // Link Management
  const addLink = () => setBuyLinks([...buyLinks, { title: '', url: '' }]);
  const removeLink = (index: number) => setBuyLinks(buyLinks.filter((_, i) => i !== index));
  const updateLink = (index: number, field: keyof BuyLookLink, value: string) => {
      const newLinks = [...buyLinks];
      newLinks[index][field] = value;
      setBuyLinks(newLinks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        // Handle Super Prompt Upload
        if (promptType === 'super') {
            const { data: catData } = await supabase.from('super_prompt_categories').select('id').eq('name', selectedCategories[0]).single();
            if (!catData) throw new Error("Invalid Category");

            // Upload Output images
            const imageUrls: string[] = [];
            for (const file of files) {
                const fileName = `super/${Date.now()}_${file.name}`;
                await supabase.storage.from('prompt-images').upload(fileName, file);
                const { data } = supabase.storage.from('prompt-images').getPublicUrl(fileName);
                imageUrls.push(data.publicUrl);
            }

            // Upload Input images
            const inputImageUrls: string[] = [];
            for (const file of inputFiles) {
                const fileName = `super/input_${Date.now()}_${file.name}`;
                await supabase.storage.from('prompt-images').upload(fileName, file);
                const { data } = supabase.storage.from('prompt-images').getPublicUrl(fileName);
                inputImageUrls.push(data.publicUrl);
            }

            // Upload Thumbnail
            let thumbnailUrl = null;
            if (thumbnailFile) {
                const fileName = `super/thumb_${Date.now()}_${thumbnailFile.name}`;
                await supabase.storage.from('prompt-images').upload(fileName, thumbnailFile);
                const { data } = supabase.storage.from('prompt-images').getPublicUrl(fileName);
                thumbnailUrl = data.publicUrl;
            }

            await supabase.from('super_prompts').insert({
                title: formData.title,
                category_id: catData.id,
                what_it_does: superData.what_it_does,
                prompt_content: promptTexts[0],
                how_to_use: superData.how_to_use,
                example_output_images: imageUrls,
                example_input_images: inputImageUrls,
                thumbnail_image: thumbnailUrl,
                created_by: user?.id,
                is_premium: formData.is_paid
            });
            navigate('/mega-prompts');
            return;
        }

        // Standard Logic
        // Upload main image
        let mainImageUrl = null;
        if (files.length > 0) {
            const file = files[0];
            const fileName = `prompts/${Date.now()}_${file.name}`;
            await supabase.storage.from('prompt-images').upload(fileName, file);
            const { data } = supabase.storage.from('prompt-images').getPublicUrl(fileName);
            mainImageUrl = data.publicUrl;
        }

        // Upload Input Image (Single for standard)
        let inputImageUrl = null;
        if (inputFiles.length > 0) {
            const file = inputFiles[0];
            const fileName = `prompts/input_${Date.now()}_${file.name}`;
            await supabase.storage.from('prompt-images').upload(fileName, file);
            const { data } = supabase.storage.from('prompt-images').getPublicUrl(fileName);
            inputImageUrl = data.publicUrl;
        }

        // Filter empty links
        const validLinks = buyLinks.filter(l => l.title.trim() && l.url.trim());

        const { data: prompt, error: promptError } = await supabase
        .from('prompts')
        .insert({
          title: formData.title,
          description: formData.description || promptTexts[0],
          category: selectedCategories[0],
          categories: selectedCategories,
          monetization_url: formData.monetization_url,
          buy_look_links: validLinks, 
          credit_name: formData.credit_name || profile?.display_name,
          instagram_handle: formData.instagram_handle,
          is_published: true,
          creator_id: user?.id,
          is_paid: formData.is_paid,
          is_bundle: files.length > 1,
          prompt_type: 'standard',
          image: mainImageUrl,
          input_image: inputImageUrl
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
            {['standard', 'super'].map(t => (
                <button 
                    key={t}
                    onClick={() => { setPromptType(t as any); setSelectedCategories([]); }}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm capitalize transition-all ${promptType === t ? 'bg-white dark:bg-gray-800 shadow-sm text-black dark:text-white' : 'text-gray-500'}`}
                >
                    {t === 'super' ? 'Mega Prompt' : 'Photography Prompt'}
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

            {/* Buy This Look (Standard Only) */}
            {promptType === 'standard' && (
                <div className="bg-slate-50 dark:bg-black/50 p-4 rounded-xl border border-slate-200 dark:border-gray-800">
                    <label className="block text-sm font-bold mb-3 text-slate-900 dark:text-white flex items-center gap-2">
                        <Shirt className="w-4 h-4" /> Buy This Look
                    </label>
                    <div className="space-y-3">
                        {buyLinks.map((link, index) => (
                            <div key={index} className="flex gap-2 items-start">
                                <div className="flex-1 space-y-2">
                                    <input 
                                        type="text" 
                                        placeholder="Item Title (e.g. Jacket)" 
                                        value={link.title} 
                                        onChange={e => updateLink(index, 'title', e.target.value)} 
                                        className="w-full p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm" 
                                    />
                                    <input 
                                        type="url" 
                                        placeholder="https://shop.com/item" 
                                        value={link.url} 
                                        onChange={e => updateLink(index, 'url', e.target.value)} 
                                        className="w-full p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm" 
                                    />
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => removeLink(index)} 
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mt-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <button 
                            type="button" 
                            onClick={addLink} 
                            className="text-sm font-bold text-blue-500 hover:underline flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" /> Add Item
                        </button>
                    </div>
                </div>
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

            {/* Main Images - Drag and Drop */}
            <div>
                <label className="block text-sm font-bold mb-2 text-slate-900 dark:text-white">
                    {promptType === 'super' ? 'Example Output Images (Optional)' : 'Main Images'} (Auto-compressed ~150KB)
                </label>
                <div className="grid grid-cols-4 gap-4">
                    {previews.map((src, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                            <img src={src} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                        </div>
                    ))}
                    <label 
                        className={cn(
                            "aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all",
                            isDraggingMain 
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                                : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                        )}
                        onDragOver={(e) => handleDragOver(e, false)}
                        onDragLeave={(e) => handleDragLeave(e, false)}
                        onDrop={(e) => handleDrop(e, false)}
                    >
                        <Upload className={cn("w-6 h-6 mb-2", isDraggingMain ? "text-blue-500" : "text-gray-400")} />
                        <span className={cn("text-xs font-bold", isDraggingMain ? "text-blue-500" : "text-gray-400")}>
                            {isDraggingMain ? "Drop Here" : "Upload"}
                        </span>
                        <input type="file" hidden multiple accept="image/*" onChange={(e) => handleFileChange(e, false)} />
                    </label>
                </div>
            </div>

            {/* Input Images (Optional) */}
            <div>
                <label className="block text-sm font-bold mb-2 text-slate-900 dark:text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> 
                    Input Image (Optional)
                    <span className="text-xs font-normal text-gray-500">
                        {promptType === 'super' ? 'Reference images' : 'Single reference image'} (Compressed ~150KB)
                    </span>
                </label>
                <div className="grid grid-cols-4 gap-4">
                    {inputPreviews.map((src, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                            <img src={src} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeFile(i, true)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                        </div>
                    ))}
                    <label 
                        className={cn(
                            "aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all",
                            isDraggingInput
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                                : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                        )}
                        onDragOver={(e) => handleDragOver(e, true)}
                        onDragLeave={(e) => handleDragLeave(e, true)}
                        onDrop={(e) => handleDrop(e, true)}
                    >
                        <Upload className={cn("w-6 h-6 mb-2", isDraggingInput ? "text-blue-500" : "text-gray-400")} />
                        <span className={cn("text-xs font-bold", isDraggingInput ? "text-blue-500" : "text-gray-400")}>
                            {isDraggingInput ? "Drop Here" : "Upload"}
                        </span>
                        <input type="file" hidden multiple={promptType === 'super'} accept="image/*" onChange={(e) => handleFileChange(e, true)} />
                    </label>
                </div>
            </div>

            {/* Mega Prompt Thumbnail (Optional) */}
            {promptType === 'super' && (
                <div>
                    <label className="block text-sm font-bold mb-2 text-slate-900 dark:text-white flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> 
                        Thumbnail Poster (Optional)
                        <span className="text-xs font-normal text-gray-500">
                            For display in list view
                        </span>
                    </label>
                    <div className="grid grid-cols-4 gap-4">
                        {thumbnailPreview ? (
                            <div className="relative aspect-square rounded-lg overflow-hidden group">
                                <img src={thumbnailPreview} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                            </div>
                        ) : (
                            <label className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                                <Upload className="w-6 h-6 text-gray-400 mb-2" />
                                <span className="text-xs font-bold text-gray-400">Upload</span>
                                <input type="file" hidden accept="image/*" onChange={handleThumbnailChange} />
                            </label>
                        )}
                    </div>
                </div>
            )}

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
