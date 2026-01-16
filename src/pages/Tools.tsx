import React, { useState, useEffect } from 'react';
import { Sparkles, Image as ImageIcon, MessageSquare, BookOpen, Send, Copy, Check, Loader2, Lock, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { enhancePrompt } from '../lib/gemini';
import { generateJsonPrompt } from '../lib/imageAnalysis';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import DotGrid from '../components/DotGrid';
import { Link, useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';

export default function Tools() {
  const { user, isPro } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'enhancer' | 'image-analysis' | 'custom' | 'guide'>('enhancer');
  
  // Enhancer State
  const [messyPrompt, setMessyPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [enhancing, setEnhancing] = useState(false);
  const [enhancerTrials, setEnhancerTrials] = useState(5);
  const [copied, setCopied] = useState(false);

  // Image Analysis State
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Custom Request State
  const [requestText, setRequestText] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    checkUsage();
    if (user?.email) setRequestEmail(user.email);
  }, [user, isPro]);

  const checkUsage = () => {
    const today = new Date().toISOString().split('T')[0];
    const key = `enhancer_usage_${today}`;
    const used = parseInt(localStorage.getItem(key) || '0');
    const dailyLimit = isPro ? 10 : 5; 
    setEnhancerTrials(Math.max(0, dailyLimit - used));
  };

  const handleEnhance = async () => {
    if (!messyPrompt.trim()) return;
    if (enhancerTrials <= 0) {
        toast.error(isPro ? "Daily limit reached." : "Free trial limit reached. Upgrade for more.");
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
        const f = e.target.files[0];
        setFile(f);
        setPreview(URL.createObjectURL(f));
        setAnalysisResult(null);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!file) return;
    setAnalyzing(true);
    try {
        const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1024, useWebWorker: true };
        const compressed = await imageCompression(file, options);
        const result = await generateJsonPrompt(compressed, false);
        setAnalysisResult(result);
    } catch (e: any) {
        toast.error(e.message);
    } finally {
        setAnalyzing(false);
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
        const { error } = await supabase.from('prompt_requests').insert({
            email: requestEmail,
            request_details: requestText,
            user_id: user?.id
        });
        if (error) throw error;
        toast.success("Request sent!");
        setRequestText('');
    } catch (e: any) {
        toast.error(e.message);
    } finally {
        setSubmittingRequest(false);
    }
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
                { id: 'image-analysis', label: 'Image to Prompt', icon: ImageIcon },
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
                    {tab.id === 'guide' && !isPro && <Lock className="w-3 h-3 ml-1 text-amber-500" />}
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

            {/* IMAGE ANALYSIS TAB */}
            {activeTab === 'image-analysis' && (
                <div className="grid lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl h-64 flex flex-col items-center justify-center relative bg-gray-50 dark:bg-black hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                            {preview ? (
                                <img src={preview} alt="Preview" className="h-full object-contain" />
                            ) : (
                                <div className="text-center text-gray-400">
                                    <ImageIcon className="w-10 h-10 mx-auto mb-2" />
                                    <p>Upload Image</p>
                                </div>
                            )}
                            <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                        </div>
                        <button 
                            onClick={handleAnalyzeImage}
                            disabled={analyzing || !file}
                            className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate JSON Prompt'}
                        </button>
                    </div>
                    <div className="bg-gray-900 rounded-2xl p-4 overflow-auto h-[500px] text-xs font-mono text-green-400 border border-gray-800">
                        {analysisResult ? JSON.stringify(analysisResult, null, 2) : '// JSON Output will appear here'}
                    </div>
                </div>
            )}

            {/* CUSTOM REQUEST TAB - LANDING PAGE */}
            {activeTab === 'custom' && (
                <div className="max-w-2xl mx-auto text-center">
                    {!isPro ? (
                        <div className="py-12">
                            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600">
                                <MessageSquare className="w-10 h-10" />
                            </div>
                            <h3 className="text-3xl font-black mb-4 text-slate-900 dark:text-white">Custom Prompt Requests</h3>
                            <p className="mb-8 text-slate-500 text-lg">
                                Can't find what you need? Our team of expert prompt engineers will craft a custom prompt just for you.
                            </p>
                            <div className="grid grid-cols-2 gap-4 mb-8 text-left max-w-md mx-auto">
                                <div className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> Tailored to your needs</div>
                                <div className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> Delivered via email</div>
                                <div className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> Expertly crafted</div>
                                <div className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-500" /> Unlimited requests</div>
                            </div>
                            <Link to="/pricing" className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg">
                                Unlock with Pro <Lock className="w-5 h-5" />
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleCustomRequest} className="space-y-4 text-left">
                            <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-4">Request a Prompt</h3>
                            <textarea 
                                value={requestText}
                                onChange={e => setRequestText(e.target.value)}
                                rows={6}
                                className="w-full p-4 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white"
                                placeholder="Describe exactly what you need..."
                            />
                            <button disabled={submittingRequest} className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-opacity">
                                {submittingRequest ? 'Sending...' : 'Send Request'}
                            </button>
                        </form>
                    )}
                </div>
            )}

            {/* GUIDE TAB - LANDING PAGE */}
            {activeTab === 'guide' && (
                <div className="flex flex-col md:flex-row items-center gap-12 py-8">
                    <div className="w-full md:w-1/3">
                        <img 
                            src="https://cdn.phototourl.com/uploads/2026-01-16-28de4ef2-0a2d-4387-af7b-320328577ddc.jpg" 
                            alt="Guide Cover" 
                            className="w-full rounded-xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500" 
                        />
                    </div>
                    <div className="w-full md:w-2/3 text-left">
                        <h2 className="text-3xl font-black mb-4 text-slate-900 dark:text-white">The Prompt Engineering Bible</h2>
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
                                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 inline-flex items-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                <BookOpen className="w-5 h-5" /> Access Guide
                            </a>
                        ) : (
                            <Link 
                                to="/pricing" 
                                className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 inline-flex items-center gap-2 shadow-lg"
                            >
                                Unlock Guide with Pro <ArrowRight className="w-5 h-5" />
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
