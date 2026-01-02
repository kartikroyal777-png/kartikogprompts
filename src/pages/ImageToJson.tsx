import React, { useState, useEffect, useRef } from 'react';
import { Upload, Image as ImageIcon, Copy, Check, Loader2, Sparkles, AlertCircle, Zap } from 'lucide-react';
import { generateJsonPrompt } from '../lib/imageAnalysis';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import AuthModal from '../components/AuthModal';
import { Link } from 'react-router-dom';

const ImageToJson = () => {
  const { user, wallet, refreshWallet } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [promptType, setPromptType] = useState<'standard' | 'product'>('standard');
  
  // Credit & Trial System
  const [freeTrialsLeft, setFreeTrialsLeft] = useState(3);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    checkDailyUsage();
  }, []);

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
      const data = await generateJsonPrompt(file, promptType === 'product');
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
    if ((wallet?.credits || 0) < 1) {
      toast.error("Insufficient credits. Please buy more credits.");
      return;
    }

    // Deduct Credit & Generate
    setProcessingPayment(true);
    try {
      const { data, error } = await supabase.rpc('deduct_credits', {
        user_uuid: user.id,
        amount: 1,
        description: 'Image to JSON Generation'
      });

      if (error) throw error;

      if (data === false) {
        toast.error("Insufficient credits");
        return;
      }

      // Refresh wallet to show new balance
      refreshWallet();
      
      // Proceed with generation
      await processGeneration();

    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error("Failed to process credit deduction");
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
      // Fallback for restricted environments (fixes NotAllowedError)
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

  return (
    <div className="min-h-screen bg-white dark:bg-black pt-24 pb-12 px-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-gray-400 opacity-20 blur-[100px]"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
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
                 <span className="font-bold text-sm">{freeTrialsLeft} Free Trials Left Today</span>
               </>
             ) : (
               <>
                 <Zap className="w-4 h-4 text-blue-500 fill-blue-500" />
                 <span className="font-bold text-sm">Cost: 1 Credit / Generation</span>
                 {user && (
                   <span className="text-xs text-gray-500 border-l border-gray-300 dark:border-gray-700 pl-2 ml-2">
                     Balance: {wallet?.credits || 0}
                   </span>
                 )}
               </>
             )}
          </div>
          
          {freeTrialsLeft === 0 && user && (wallet?.credits || 0) < 1 && (
             <div className="mt-3">
               <Link to="/buy-credits" className="text-xs font-bold text-blue-500 hover:underline">
                 Buy Credits &rarr;
               </Link>
             </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-2 shadow-xl border border-gray-100 dark:border-gray-800">
              {/* Type Toggle */}
              <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-4">
                <button
                  onClick={() => setPromptType('standard')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                    promptType === 'standard'
                      ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Standard
                </button>
                <button
                  onClick={() => setPromptType('product')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                    promptType === 'product'
                      ? 'bg-white dark:bg-black text-black dark:text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Product Shot
                </button>
              </div>

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
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};

export default ImageToJson;
