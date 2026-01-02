import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Upload, Loader2, Copy, Check, Image as ImageIcon, Box } from 'lucide-react';
import DotGrid from '../components/DotGrid';
import { useTheme } from '../context/ThemeContext';
import { generateJsonPrompt } from '../lib/imageAnalysis';
import toast from 'react-hot-toast';

export default function ImageToJson() {
  const { theme } = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isProduct, setIsProduct] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const json = await generateJsonPrompt(file, isProduct);
      setResult(json);
      toast.success("Analysis Complete!");
    } catch (error: any) {
      toast.error(error.message || "Failed to analyze image");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black pt-24 pb-12 px-4 relative overflow-hidden">
      
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
        <DotGrid 
          baseColor={theme === 'dark' ? '#333' : '#ddd'}
          activeColor={theme === 'dark' ? '#fff' : '#000'}
          dotSize={6}
          gap={30}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tight text-black dark:text-white">
              Image to <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-black dark:from-gray-400 dark:to-white">JSON</span>
            </h1>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Upload any image to extract a detailed technical JSON prompt. 
              Perfect for recreating styles or product photography.
            </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Upload Section */}
            <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl">
                {/* Mode Switch */}
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
                    <button 
                        onClick={() => setIsProduct(false)}
                        className={`flex-1 py-3 rounded-lg font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${!isProduct ? 'bg-white dark:bg-black shadow-sm text-black dark:text-white' : 'text-gray-500'}`}
                    >
                        <ImageIcon className="w-4 h-4" /> Standard Image
                    </button>
                    <button 
                        onClick={() => setIsProduct(true)}
                        className={`flex-1 py-3 rounded-lg font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${isProduct ? 'bg-white dark:bg-black shadow-sm text-black dark:text-white' : 'text-gray-500'}`}
                    >
                        <Box className="w-4 h-4" /> Product Shot
                    </button>
                </div>

                {!preview ? (
                    <label className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl h-64 md:h-80 flex flex-col items-center justify-center cursor-pointer hover:border-black dark:hover:border-white transition-colors">
                        <Upload className="w-12 h-12 text-gray-400 mb-4" />
                        <span className="font-bold text-lg text-black dark:text-white">Click to Upload</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                ) : (
                    <div className="space-y-6">
                        <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800">
                            <img src={preview} alt="Preview" className="w-full h-auto max-h-[400px] object-contain bg-gray-100 dark:bg-black" />
                            <button 
                                onClick={() => { setFile(null); setPreview(null); setResult(null); }}
                                className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-bold backdrop-blur-md hover:bg-black/70"
                            >
                                Change Image
                            </button>
                        </div>
                        <button
                            onClick={handleAnalyze}
                            disabled={loading}
                            className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-lg rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            {loading ? 'Analyzing...' : 'Generate JSON Prompt'}
                        </button>
                    </div>
                )}
            </div>

            {/* Result Section - Mobile Optimized */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-4 md:p-8 border border-gray-200 dark:border-gray-800 h-full min-h-[300px] md:min-h-[500px] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl text-black dark:text-white">JSON Output</h3>
                    {result && (
                        <button 
                            onClick={copyToClipboard}
                            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied' : 'Copy JSON'}
                        </button>
                    )}
                </div>
                
                <div className="flex-1 bg-white dark:bg-black rounded-xl p-4 overflow-auto font-mono text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 shadow-inner max-h-[500px] md:max-h-[600px] w-full">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-gray-400 animate-pulse py-12">
                            Processing image data...
                        </div>
                    ) : result ? (
                        <pre className="whitespace-pre-wrap break-words overflow-x-hidden">{JSON.stringify(result, null, 2)}</pre>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 py-12 text-center">
                            Upload an image to see the JSON prompt here.
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
