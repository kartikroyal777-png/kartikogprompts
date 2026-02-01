import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, Camera, X } from 'lucide-react';
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
import { compressImageSafe } from '../lib/compress';
import DotGrid from '../components/DotGrid';

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

  // Admin Check
  const isAdmin = user?.email === 'kartikroyal777@gmail.com';

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
      const imageToAnalyze = await compressImageSafe(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1024,
        fileType: 'image/jpeg'
      });

      const result = await analyzeImage(imageToAnalyze);
      setAnalysis(result);
      setStep('result');
    } catch (error: any) {
      console.error("Analysis Error:", error);
      let msg = error.message || "Analysis failed.";
      if (msg.includes("User not found")) msg = "AI Service is busy. Please try again.";
      toast.error(msg);
      setStep('upload');
    }
  };

  const handlePublishClick = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!customName && profile?.full_name) {
        setCustomName(profile.full_name);
    }
    setShowPublishModal(true);
  };

  const confirmPublish = async () => {
    setIsPublishing(true);

    try {
      const { data: { user: freshUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !freshUser) {
          throw new Error("Session expired. Please sign in again.");
      }

      if (!file || !analysis) {
          throw new Error("Missing required data.");
      }
      
      const compressedFile = await compressImageSafe(file, {
        maxSizeMB: 0.5, 
        maxWidthOrHeight: 800,
      });

      const fileExt = file.name.split('.').pop();
      const fileName = `rate-me/${freshUser.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('prompt-images')
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('prompt-images')
        .getPublicUrl(fileName);

      const entryData = {
        user_id: freshUser.id,
        image_url: publicUrl,
        gender: gender,
        parameters: analysis.parameters,
        ai_base_score: analysis.final_score,
        is_published: true,
        player_name: customName || profile?.full_name || 'Anonymous',
        social_links: socials
      };

      if (isAdmin) {
        const { error: insertError } = await supabase.from('rate_me_entries').insert(entryData);
        if (insertError) throw insertError;
        toast.success("Admin Entry Published!");
      } else {
        const { data: existingEntry } = await supabase
            .from('rate_me_entries')
            .select('id')
            .eq('user_id', freshUser.id)
            .eq('gender', gender)
            .maybeSingle();

        if (existingEntry) {
            const { error: updateError } = await supabase
                .from('rate_me_entries')
                .update(entryData)
                .eq('id', existingEntry.id);
            if (updateError) throw updateError;
            toast.success("Your rating has been updated!");
        } else {
            const { error: insertError } = await supabase.from('rate_me_entries').insert(entryData);
            if (insertError) throw insertError;
            toast.success("Published to Leaderboard!");
        }
      }

      setShowPublishModal(false);
      setRefreshLeaderboard(prev => prev + 1);
      
      setTimeout(() => {
        document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);

    } catch (error: any) {
      console.error("Publish Error:", error);
      let msg = error.message || "Unknown error";
      if (msg.includes("User not found") || msg.includes("JWT")) {
          msg = "Session expired. Please sign in again.";
          setShowAuthModal(true);
      }
      toast.error(msg);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white pt-24 pb-24 px-4 overflow-x-hidden transition-colors duration-300">
      
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <DotGrid 
          baseColor={theme === 'dark' ? '#ffffff' : '#000000'}
          activeColor="#888888"
          dotSize={4}
          gap={30}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full text-black dark:text-white text-xs font-bold mb-6 shadow-sm"
        >
          <Sparkles className="w-3 h-3" />
          AI Aesthetic Analysis
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-black dark:text-white">
          Rate Me
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          Upload your best photo. Get a precise AI rating (0-100). Compete for the "OG Icon of the Year" award.
        </p>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start mb-24">
        
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 text-center border-dashed border-2 hover:border-black dark:hover:border-white transition-colors shadow-sm"
              >
                {!preview ? (
                  <label className="cursor-pointer block py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-black dark:text-white">
                      <Camera className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-black dark:text-white mb-2">Upload Photo</h3>
                    <p className="text-gray-500 text-sm mb-6">Supports JPG, PNG, WEBP (Max 5MB)</p>
                    <span className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-opacity">
                      Select Image
                    </span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                ) : (
                  <div className="space-y-6">
                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden mx-auto max-w-xs shadow-lg border border-gray-200 dark:border-gray-800">
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
                      className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 hover:opacity-90"
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
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[400px] shadow-sm"
              >
                <div className="relative w-20 h-20 mb-8">
                  <div className="absolute inset-0 border-4 border-gray-100 dark:border-gray-800 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-t-black dark:border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-black dark:text-white animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-black dark:text-white mb-2">Analyzing...</h3>
                <p className="text-gray-500">Checking symmetry, outfit, and aura.</p>
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
                  className="mt-6 text-gray-500 hover:text-black dark:hover:text-white text-sm font-bold flex items-center gap-2 mx-auto transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" /> Try Another Photo
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div id="leaderboard" className="relative z-10">
          <Leaderboard refreshTrigger={refreshLeaderboard} />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-24">
        <FeatureAnalysis />
        <FAQ />
      </div>

      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-black dark:text-white mb-4">Join the Leaderboard</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Name</label>
                <input 
                  type="text" 
                  placeholder="Your Name"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-black dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setGender('Men')}
                    className={`py-2 rounded-lg font-bold text-sm transition-colors ${gender === 'Men' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
                  >
                    Men
                  </button>
                  <button 
                    onClick={() => setGender('Women')}
                    className={`py-2 rounded-lg font-bold text-sm transition-colors ${gender === 'Women' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
                  >
                    Women
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowPublishModal(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmPublish}
                  disabled={isPublishing}
                  className="flex-1 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 flex items-center justify-center gap-2"
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
