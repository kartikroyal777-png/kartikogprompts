import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Copy, Check, Loader2, Sparkles, Zap, Send, Mail } from 'lucide-react';
import { generateJsonPrompt } from '../lib/imageAnalysis';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import AuthModal from '../components/AuthModal';
import { Link } from 'react-router-dom';
import DotGrid from '../components/DotGrid';
import { useTheme } from '../context/ThemeContext';
import { compressImageSafe } from '../lib/compress';
import { cn } from '../lib/utils';

const ImageToJson = () => {
  const { user, wallet, refreshProfile } = useAuth();
  const { theme } = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  
  // Credit & Trial System
  const [freeTrialsLeft, setFreeTrialsLeft] = useState(3);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Request Prompt State
  const [requestText, setRequestText] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [requestImage, setRequestImage] = useState<File | null>(null);
  const [requestImagePreview, setRequestImagePreview] = useState<string | null>(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    checkDailyUsage();
    if (user && user.email) {
        setRequestEmail(user.email);
    }
  }, [user]);

  const checkDailyUsage = () => {
    const today = new Date().toISOString().split('T')[0];
    const usageKey = `image_to_json_usage_${today}`;
    const usage = parseInt(localStorage.getItem(usageKey) || '0');
    setFreeTrialsLeft(Math.max(0, 3 - usage));
  };

  const incrementDailyUsage = () => {
    const today = new Date().toISOString().split('T')[0];
    const usageKey = `image_to_json_usage_${today}`;
    const currentUsage = parseInt(localStorage.getItem(usageKey) || '0');
    localStorage.setItem(usageKey, (currentUsage + 1).toString());
    setFreeTrialsLeft(Math.max(0, 2 - currentUsage));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  };

  const processGeneration = async () => {
    if (!file) return;
    
    setLoading(true);
    try {
      // Always standard mode now
      const data = await generateJsonPrompt(file, false);
      setResult(data);
      toast.success("Analysis complete!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to analyze image");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      toast.error("Please upload an image first");
      return;
    }

    // Scenario 1: User has free trials left
    if (freeTrialsLeft > 0) {
      await processGeneration();
      incrementDailyUsage();
      return;
    }

    // Scenario 2: Free trials used, user NOT logged in
    if (!user) {
      setShowAuthModal(true);
      toast('Please log in to continue using this feature', {
        icon: '🔒',
      });
      return;
    }

    // Scenario 3: Free trials used, user logged in -> Check Credits
    if ((wallet?.balance_credits || 0) < 1) {
      toast.error("Insufficient credits. Please buy more credits.");
      return;
    }

    // Deduct Credit & Generate
    setProcessingPayment(true);
    try {
      // Use p_ prefix to match the database function signature exactly
      const { data, error } = await supabase.rpc('deduct_credits', {
        p_user_id: user.id,
        p_amount: 1,
        p_description: 'Image to JSON Generation'
      });

      if (error) throw error;

      if (data === false) {
        toast.error("Insufficient credits");
        return;
      }

      // Refresh wallet to show new balance
      await refreshProfile();
      
      // Proceed with generation
      await processGeneration();

    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error("Failed to process credit deduction: " + error.message);
    } finally {
      setProcessingPayment(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result) return;
    const text = JSON.stringify(result, null, 2);
    let success = false;

    try {
      await navigator.clipboard.writeText(text);
      success = true;
    } catch (err) {
      // Fallback for restricted environments
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        success = document.execCommand('copy');
      } catch (e) {
        console.error("Fallback copy failed", e);
      }
      document.body.removeChild(textArea);
    }

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Request Prompt Handlers
  const handleRequestImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRequestImage(file);
      setRequestImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestText.trim()) return toast.error("Please describe the prompt you need.");
    if (!requestEmail.trim()) return toast.error("Please provide your email.");

    setSubmittingRequest(true);
    try {
        let imageUrl = null;

        // Upload image if present
        if (requestImage) {
            const compressedFile = await compressImageSafe(requestImage, {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1024,
            });
            const fileExt = compressedFile.type.split('/')[1] || 'jpg';
            const fileName = `requests/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('prompt-images')
                .upload(fileName, compressedFile);
            
            if (uploadError) throw uploadError;
            
            const { data } = supabase.storage.from('prompt-images').getPublicUrl(fileName);
            imageUrl = data.publicUrl;
        }

        // Insert Request
        const { error: insertError } = await supabase
            .from('prompt_requests')
            .insert({
                email: requestEmail,
                request_details: requestText,
                reference_image: imageUrl,
                user_id: user?.id || null
            });

        if (insertError) throw insertError;

        toast.success("Request sent to Admin!");
        setRequestText('');
        setRequestImage(null);
        setRequestImagePreview(null);
        if (!user) setRequestEmail('');

    } catch (error: any) {
        console.error("Request failed:", error);
        toast.error("Failed to send request: " + error.message);
    } finally {
        setSubmittingRequest(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black pt-24 pb-12 px-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <DotGrid 
          baseColor={theme === 'dark' ? '#0ea5e9' : '#38bdf8'}
          activeColor="#0284c7"
          dotSize={8}
          gap={25}
        />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-slate-900 dark:text-white">
            Image to <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600">JSON Prompt</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto mb-6">
            Upload any image to get a detailed, AI-analyzed JSON prompt structure perfect for recreation.
          </p>
          
          {/* Usage Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
             {freeTrialsLeft > 0 ? (
               <>
                 <Sparkles className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                 <span className="font-bold text-sm text-slate-900 dark:text-white">{freeTrialsLeft} Free Trials Left Today</span>
               </>
             ) : (
               <>
                 <Zap className="w-4 h-4 text-blue-500 fill-blue-500" />
                 <span className="font-bold text-sm text-slate-900 dark:text-white">Cost: 1 Credit / Generation</span>
                 {user && (
                   <span className="text-xs text-gray-500 border-l border-gray-300 dark:border-gray-700 pl-2 ml-2">
                     Balance: {wallet?.balance_credits || 0}
                   </span>
                 )}
               </>
             )}
          </div>
          
          {freeTrialsLeft === 0 && user && (wallet?.balance_credits || 0) < 1 && (
             <div className="mt-3">
               <Link to="/buy-credits" className="text-xs font-bold text-blue-500 hover:underline">
                 Buy Credits &rarr;
               </Link>
             </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-24">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-2 shadow-xl border border-gray-100 dark:border-gray-800">
              
              <div
                className={`relative border-2 border-dashed rounded-2xl transition-all h-[400px] flex flex-col items-center justify-center text-center p-8 ${
                  preview
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                    : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                {preview ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <p className="text-white font-medium flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Change Image
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        Drop your image here
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        or click to browse
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">
                      Supports JPG, PNG, WEBP (Max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!file || loading || processingPayment}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98] ${
                !file || loading || processingPayment
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90 glow-button'
              }`}
            >
              {loading || processingPayment ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {processingPayment ? 'Processing Payment...' : 'Analyzing...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate JSON Prompt
                </>
              )}
            </button>
          </div>

          {/* Result Section */}
          <div className="h-full">
            <div className={`h-full bg-gray-900 rounded-3xl p-6 shadow-xl border border-gray-800 overflow-hidden flex flex-col ${!result ? 'justify-center items-center' : ''}`}>
              {!result ? (
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 border-2 border-gray-600 border-t-transparent rounded-full animate-pulse"></div>
                  </div>
                  <p>JSON output will appear here</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy JSON'}
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto custom-scrollbar -mx-2 px-2">
                    <pre className="text-xs md:text-sm font-mono text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Request Custom Prompt Section */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-800">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Can't find what you need?</h2>
                <p className="text-slate-500 dark:text-slate-400">Request a custom prompt from our team. We'll craft it and email it to you.</p>
            </div>

            <form onSubmit={handleRequestSubmit} className="max-w-2xl mx-auto space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Describe your prompt idea <span className="text-red-500">*</span>
                            </label>
                            <textarea 
                                required
                                value={requestText}
                                onChange={e => setRequestText(e.target.value)}
                                rows={6}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none resize-none"
                                placeholder="E.g., A futuristic cyberpunk city with neon lights, raining, reflections on wet pavement..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Your Email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input 
                                    type="email"
                                    required
                                    value={requestEmail}
                                    onChange={e => setRequestEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Reference Image (Optional)
                        </label>
                        <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white transition-colors bg-gray-50 dark:bg-black group">
                            {requestImagePreview ? (
                                <>
                                    <img src={requestImagePreview} alt="Reference" className="w-full h-full object-cover" />
                                    <button 
                                        type="button"
                                        onClick={() => { setRequestImage(null); setRequestImagePreview(null); }}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <div className="w-4 h-4 flex items-center justify-center font-bold">×</div>
                                    </button>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
                                    <ImageIcon className="w-8 h-8 mb-2" />
                                    <span className="text-xs font-bold">Upload Reference</span>
                                </div>
                            )}
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleRequestImageChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Upload a style reference to help us understand better.
                        </p>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={submittingRequest}
                    className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
                >
                    {submittingRequest ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    Send Request to Admin
                </button>
            </form>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};

export default ImageToJson;
