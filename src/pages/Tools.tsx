import React, { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, BookOpen, Copy, Check, Loader2, Lock, ArrowRight, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { enhancePrompt } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import DotGrid from '../components/DotGrid';
import { Link, useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { cn } from '../lib/utils';

export default function Tools() {
  const { user, isPro } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'enhancer' | 'custom' | 'guide'>('enhancer');
  
  // Enhancer State
  const [messyPrompt, setMessyPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [enhancing, setEnhancing] = useState(false);
  const [enhancerTrials, setEnhancerTrials] = useState(5);
  const [copied, setCopied] = useState(false);

  // Custom Request State
  const [requestText, setRequestText] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [requestImage, setRequestImage] = useState<File | null>(null);
  const [requestImagePreview, setRequestImagePreview] = useState<string | null>(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Updated Book Cover
  const BOOK_COVER_URL = "https://cdn.phototourl.com/uploads/2026-01-16-3c469bae-6e25-4d7a-a332-fdd7e876d267.jpg";

  useEffect(() => {
    checkUsage();
    if (user?.email) setRequestEmail(user.email);
  }, [user, isPro]);

  const checkUsage = () => {
    const today = new Date().toISOString().split('T')[0];
    const key = `enhancer_usage_${today}`;
    const used = parseInt(localStorage.getItem(key) || '0');
    // Pro: 5 daily trials. Free: 2 daily trials (approx 60/month, simpler than tracking monthly)
    const dailyLimit = isPro ? 5 : 2; 
    setEnhancerTrials(Math.max(0, dailyLimit - used));
  };

  const handleEnhance = async () => {
    if (!messyPrompt.trim()) return;
    if (enhancerTrials <= 0) {
        toast.error(isPro ? "Daily limit reached (5/5)." : "Free trial limit reached. Upgrade for more.");
        return;
    }

    setEnhancing(true);
    try {
        const result = await enhancePrompt(messyPrompt);
        setEnhancedPrompt(result);
        
        const today = new Date().toISOString().split('T')[0];
        const key = `enhancer_usage_${today}`;
        const used = parseInt(localStorage.getItem(key) || '0');
        localStorage.setItem(key, (used + 1).toString());
        setEnhancerTrials(prev => prev - 1);
        
    } catch (e: any) {
        toast.error(e.message);
    } finally {
        setEnhancing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied!");
  };

  const handleRequestImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRequestImage(file);
      setRequestImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
            setRequestImage(file);
            setRequestImagePreview(URL.createObjectURL(file));
        } else {
            toast.error("Please upload an image file.");
        }
    }
  };

  const handleCustomRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPro) {
        navigate('/pricing');
        return;
    }
    setSubmittingRequest(true);
    try {
        let imageUrl = null;
        if (requestImage) {
            // FIX: Disable WebWorker to prevent runtime crash in WebContainer
            const options = { maxSizeMB: 0.05, maxWidthOrHeight: 800, useWebWorker: false }; 
            const compressed = await imageCompression(requestImage, options);
            const fileName = `requests/${Date.now()}_${Math.random().toString(36).substring(7)}`;
            await supabase.storage.from('prompt-images').upload(fileName, compressed);
            const { data } = supabase.storage.from('prompt-images').getPublicUrl(fileName);
            imageUrl = data.publicUrl;
        }

        const { error } = await supabase.from('prompt_requests').insert({
            email: requestEmail,
            request_details: requestText,
            user_id: user?.id,
            reference_image: imageUrl
        });
        if (error) throw error;
        toast.success("Request sent!");
        setRequestText('');
        setRequestImage(null);
        setRequestImagePreview(null);
    } catch (e: any) {
        toast.error(e.message);
    } finally {
        setSubmittingRequest(false);
    }
  };

  const handleLockedAction = () => {
      navigate('/pricing');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black pt-24 pb-24 px-4 overflow-hidden relative">
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
        <DotGrid baseColor={theme === 'dark' ? '#ffffff' : '#000000'} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-slate-900 dark:text-white">Creator Tools</h1>
          <p className="text-slate-600 dark:text-slate-400">Everything you need to create better prompts.</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[
                { id: 'enhancer', label: 'Prompt Enhancer', icon: Sparkles },
                { id: 'custom', label: 'Custom Request', icon: MessageSquare },
                { id: 'guide', label: 'Engineering Guide', icon: BookOpen },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
                        activeTab === tab.id 
                            ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg' 
                            : 'bg-white dark:bg-gray-900 text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {tab.id !== 'enhancer' && !isPro && <Lock className="w-3 h-3 ml-1 text-amber-500" />}
                </button>
            ))}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 min-h-[500px]">
            
            {/* ENHANCER TAB */}
            {activeTab === 'enhancer' && (
                <div className="grid lg:grid-cols-2 gap-8 h-full">
                    <div className="flex flex-col h-full">
                        <label className="font-bold mb-2 text-slate-900 dark:text-white">Your Messy Thought</label>
                        <textarea 
                            value={messyPrompt}
                            onChange={e => setMessyPrompt(e.target.value)}
                            className="flex-1 w-full p-4 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 resize-none focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                            placeholder="e.g. write a blog about coffee..."
                        />
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-xs text-slate-500">{enhancerTrials} trials left today</span>
                            <button 
                                onClick={handleEnhance}
                                disabled={enhancing || !messyPrompt}
                                className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                            >
                                {enhancing ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                Enhance
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col h-full bg-gray-50 dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 p-4 relative">
                        <div className="flex justify-between items-center mb-2">
                            <label className="font-bold text-slate-900 dark:text-white">Engineered Prompt</label>
                            {enhancedPrompt && (
                                <button onClick={() => handleCopy(enhancedPrompt)} className="text-xs flex items-center gap-1 hover:text-blue-500 text-slate-500">
                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copy
                                </button>
                            )}
                        </div>
                        <div className="flex-1 overflow-auto whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-mono">
                            {enhancedPrompt || <span className="text-slate-400 italic">Result will appear here...</span>}
                        </div>
                    </div>
                </div>
            )}

            {/* CUSTOM REQUEST TAB */}
            {activeTab === 'custom' && (
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-black dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-white dark:text-black shadow-lg">
                            <MessageSquare className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Request a Prompt</h3>
                        <p className="text-slate-500 dark:text-slate-400">
                            Can't find what you need? Our team of expert prompt engineers will craft a custom prompt just for you.
                        </p>
                    </div>

                    <form onSubmit={handleCustomRequest} className="space-y-6 text-left">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Describe your idea
                            </label>
                            <textarea 
                                value={requestText}
                                onChange={e => setRequestText(e.target.value)}
                                rows={5}
                                className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white"
                                placeholder="E.g., A futuristic cyberpunk city with neon lights, raining, reflections on wet pavement..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Your Email
                            </label>
                            <input 
                                type="email"
                                value={requestEmail}
                                onChange={e => setRequestEmail(e.target.value)}
                                className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white"
                                placeholder="you@example.com"
                            />
                        </div>
                        
                        {/* Image Upload with Drag & Drop */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Reference Image (Optional)
                            </label>
                            <label 
                                className={cn(
                                    "relative aspect-video rounded-xl overflow-hidden border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all bg-gray-50 dark:bg-black group",
                                    isDragging 
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                                        : "border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white"
                                )}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                {requestImagePreview ? (
                                    <>
                                        <img src={requestImagePreview} alt="Reference" className="w-full h-full object-cover" />
                                        <button 
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); setRequestImage(null); setRequestImagePreview(null); }}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        >
                                            <div className="w-4 h-4 flex items-center justify-center font-bold">×</div>
                                        </button>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
                                        <Upload className={cn("w-8 h-8 mb-2", isDragging ? "text-blue-500" : "text-gray-400")} />
                                        <span className={cn("text-xs font-bold", isDragging ? "text-blue-500" : "text-gray-400")}>
                                            {isDragging ? "Drop Here" : "Upload"}
                                        </span>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleRequestImageChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </label>
                        </div>

                        {isPro ? (
                            <button 
                                type="submit"
                                disabled={submittingRequest} 
                                className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg"
                            >
                                {submittingRequest ? 'Sending...' : 'Send Request'}
                            </button>
                        ) : (
                            <button 
                                type="button"
                                onClick={handleLockedAction}
                                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2"
                            >
                                <Lock className="w-5 h-5" /> Unlock to Send Request
                            </button>
                        )}
                    </form>
                </div>
            )}

            {/* GUIDE TAB */}
            {activeTab === 'guide' && (
                <div className="flex flex-col md:flex-row items-center gap-12 py-8">
                    <div className="w-full md:w-1/3">
                        <img 
                            src={BOOK_COVER_URL} 
                            alt="Guide Cover" 
                            className="w-full rounded-xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500" 
                        />
                    </div>
                    <div className="w-full md:w-2/3 text-left">
                        <h2 className="text-3xl font-black mb-4 text-slate-900 dark:text-white">The Prompt Engineering Guide</h2>
                        <p className="mb-6 text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                            Master the art of prompting with our comprehensive guide. Learn the frameworks used by experts to control AI outputs with precision.
                        </p>
                        
                        <div className="space-y-3 mb-8">
                            <div className="flex items-center gap-3"><Check className="w-5 h-5 text-green-500" /> <span className="font-bold">ROSES Framework</span> for complex tasks</div>
                            <div className="flex items-center gap-3"><Check className="w-5 h-5 text-green-500" /> <span className="font-bold">Zero-Shot Formula</span> for quick results</div>
                            <div className="flex items-center gap-3"><Check className="w-5 h-5 text-green-500" /> <span className="font-bold">Persona Engineering</span> (VOICE)</div>
                            <div className="flex items-center gap-3"><Check className="w-5 h-5 text-green-500" /> <span className="font-bold">Chain-of-Thought</span> reasoning</div>
                        </div>

                        {isPro ? (
                            <a 
                                href="https://drive.google.com/file/d/1TFTCnJmeSH_ZoJNC3wbFdz_PnPcpKxeD/view?usp=sharing" 
                                target="_blank" 
                                rel="noreferrer"
                                className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 inline-flex items-center gap-2 shadow-lg"
                            >
                                <BookOpen className="w-5 h-5" /> Access Guide
                            </a>
                        ) : (
                            <button 
                                onClick={handleLockedAction}
                                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:opacity-90 inline-flex items-center gap-2 shadow-lg"
                            >
                                <Lock className="w-5 h-5" /> Unlock Guide with Pro
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
