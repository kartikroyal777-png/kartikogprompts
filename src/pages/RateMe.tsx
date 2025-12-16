import React, { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles, ArrowRight, Loader2, Camera, X } from 'lucide-react';
import { analyzeImage } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ResultCard from '../components/rate-me/ResultCard';
import Leaderboard from '../components/rate-me/Leaderboard';
import FeatureAnalysis from '../components/rate-me/FeatureAnalysis';
import FAQ from '../components/rate-me/FAQ';
import AuthModal from '../components/AuthModal';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

// Lazy load the animated background for better performance
const DotGrid = React.lazy(() => import('../components/DotGrid'));

export default function RateMe() {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const [step, setStep] = useState<'upload' | 'analyzing' | 'result'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  
  // Publish Form
  const [gender, setGender] = useState<'Men' | 'Women'>('Men');
  const [socials, setSocials] = useState({ instagram: '', twitter: '' });
  const [customName, setCustomName] = useState('');
  const [refreshLeaderboard, setRefreshLeaderboard] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const startAnalysis = async () => {
    if (!file) return;
    setStep('analyzing');
    try {
      const result = await analyzeImage(file);
      setAnalysis(result);
      setStep('result');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Analysis failed. Please try a clearer photo.");
      setStep('upload');
    }
  };

  const handlePublishClick = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    // Pre-fill name if available
    if (!customName && profile?.full_name) {
        setCustomName(profile.full_name);
    }
    setShowPublishModal(true);
  };

  const confirmPublish = async () => {
    if (!user || !file || !analysis) return;
    setIsPublishing(true);

    try {
      // 0. Compress Image for Leaderboard
      const options = {
        maxSizeMB: 0.5, // 500KB max for leaderboard
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      // 1. Upload Image
      const fileExt = file.name.split('.').pop();
      const fileName = `rate-me/${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('prompt-images')
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('prompt-images')
        .getPublicUrl(fileName);

      // 2. Save Entry
      const { error: dbError } = await supabase
        .from('rate_me_entries')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          gender: gender,
          parameters: analysis.parameters,
          ai_base_score: analysis.final_score,
          is_published: true,
          player_name: customName || profile?.full_name || 'Anonymous',
          social_links: socials
        });

      if (dbError) throw dbError;

      toast.success("Published to Leaderboard!");
      setShowPublishModal(false);
      setRefreshLeaderboard(prev => prev + 1);
      
      // Scroll to leaderboard
      setTimeout(() => {
        document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);

    } catch (error: any) {
      console.error(error);
      toast.error("Failed to publish: " + error.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pt-24 pb-24 px-4 overflow-x-hidden transition-colors duration-300">
      
      {/* Background Animation - Lazy Loaded */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <Suspense fallback={<div className="w-full h-full bg-transparent" />}>
          <DotGrid 
            baseColor={theme === 'dark' ? '#1e293b' : '#cbd5e1'} 
            activeColor="#0ea5e9"
            dotSize={2}
            gap={24}
          />
        </Suspense>
      </div>

      {/* Hero / Intro */}
      <div className="relative z-10 max-w-4xl mx-auto text-center mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-full text-sky-600 dark:text-sky-400 text-sm font-bold mb-6"
        >
          <Sparkles className="w-4 h-4" />
          AI Aesthetic Analysis
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-slate-900 dark:text-white">
          Rate <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">Me</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
          Upload your best photo. Get a precise AI rating (0-100). Compete for the "OG Icon of the Year" award.
        </p>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start mb-24">
        
        {/* Left: Action Area */}
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center border-dashed border-2 hover:border-sky-500/50 transition-colors shadow-xl"
              >
                {!preview ? (
                  <label className="cursor-pointer block py-12">
                    <div className="w-20 h-20 bg-sky-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-sky-500">
                      <Camera className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Upload Photo</h3>
                    <p className="text-slate-500 text-sm mb-6">Supports JPG, PNG, WEBP (Max 5MB)</p>
                    <span className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-opacity">
                      Select Image
                    </span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                ) : (
                  <div className="space-y-6">
                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden mx-auto max-w-xs shadow-2xl">
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => { setFile(null); setPreview(null); }}
                        className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={startAnalysis}
                      className="w-full py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      Analyze Aesthetics
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {step === 'analyzing' && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[400px] shadow-xl"
              >
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-t-sky-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-sky-500 animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">AI is Judging You...</h3>
                <p className="text-slate-500 dark:text-slate-400">Analyzing facial symmetry, outfit coordination, and overall aura.</p>
              </motion.div>
            )}

            {step === 'result' && analysis && (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <ResultCard 
                  image={preview!} 
                  data={analysis.parameters} 
                  finalScore={analysis.final_score}
                  onPublish={handlePublishClick}
                  isPublishing={isPublishing}
                />
                <button 
                  onClick={() => setStep('upload')}
                  className="mt-6 text-slate-500 hover:text-sky-500 text-sm font-medium flex items-center gap-2 mx-auto transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" /> Try Another Photo
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Leaderboard Preview */}
        <div id="leaderboard" className="relative z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 to-blue-500/5 rounded-3xl blur-3xl -z-10" />
          <Leaderboard refreshTrigger={refreshLeaderboard} />
        </div>
      </div>

      {/* New Sections */}
      <div className="relative z-10 max-w-7xl mx-auto space-y-24">
        <FeatureAnalysis />
        <FAQ />
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Join the Leaderboard</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Display Name</label>
                <input 
                  type="text" 
                  placeholder="Your Name / Nickname"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Gender Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setGender('Men')}
                    className={`py-2 rounded-lg font-bold text-sm transition-colors ${gender === 'Men' ? 'bg-sky-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                  >
                    Men
                  </button>
                  <button 
                    onClick={() => setGender('Women')}
                    className={`py-2 rounded-lg font-bold text-sm transition-colors ${gender === 'Women' ? 'bg-pink-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                  >
                    Women
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Instagram (Optional)</label>
                <input 
                  type="text" 
                  placeholder="https://instagram.com/..."
                  value={socials.instagram}
                  onChange={e => setSocials({...socials, instagram: e.target.value})}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Twitter/X (Optional)</label>
                <input 
                  type="text" 
                  placeholder="https://x.com/..."
                  value={socials.twitter}
                  onChange={e => setSocials({...socials, twitter: e.target.value})}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowPublishModal(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmPublish}
                  disabled={isPublishing}
                  className="flex-1 py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 flex items-center justify-center gap-2"
                >
                  {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
