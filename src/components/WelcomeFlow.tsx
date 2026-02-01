import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, BookOpen, ArrowRight, CheckCircle, Camera } from 'lucide-react';

interface WelcomeFlowProps {
  onComplete: () => void;
}

const WelcomeFlow: React.FC<WelcomeFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'splash' | 'onboarding'>('splash');
  const [currentSlide, setCurrentSlide] = useState(0);
  const LOGO_URL = "https://cdn.phototourl.com/uploads/2026-01-16-b1550510-f87e-4751-b08e-9d4421d7a041.jpg";
  const GUIDE_COVER = "https://cdn.phototourl.com/uploads/2026-01-16-3c469bae-6e25-4d7a-a332-fdd7e876d267.jpg";

  useEffect(() => {
    const timer = setTimeout(() => {
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding_v5'); // Incremented version
      if (hasSeenOnboarding) {
        onComplete();
      } else {
        setStep('onboarding');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      localStorage.setItem('hasSeenOnboarding_v5', 'true');
      onComplete();
    }
  };

  const slides = [
    {
      type: 'standard',
      icon: Camera,
      title: "Photography Prompts",
      desc: "Create stunning, cinematic visuals with our curated collection.",
    },
    {
      type: 'standard',
      icon: Zap,
      title: "Mega Prompts",
      desc: "High-impact, specialized prompts for Finance, SEO, and Business.",
    },
    {
      type: 'image',
      image: GUIDE_COVER,
      title: "Prompt Engineering Guide",
      desc: "Master the art of controlling AI with expert frameworks.",
    },
    {
      type: 'standard',
      icon: Sparkles,
      title: "AI Enhancer Tools",
      desc: "Turn messy thoughts into perfect prompts instantly.",
    }
  ];

  if (step === 'splash') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-black"
      >
        <div className="flex flex-col items-center justify-center gap-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-28 h-28 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-gray-100 dark:ring-gray-800"
          >
            <img 
              src={LOGO_URL} 
              alt="Logo" 
              className="w-full h-full object-cover" 
            />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-3xl font-black text-black dark:text-white tracking-tight mb-2">OG Prompts</h1>
            <p className="text-gray-400 font-medium tracking-widest uppercase text-xs">The Ultimate Library</p>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-white dark:bg-black flex flex-col overflow-hidden"
    >
      {/* Subtle Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 w-full max-w-md mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center w-full flex flex-col items-center"
          >
            {slides[currentSlide].type === 'image' ? (
              <div className="relative w-40 h-56 mx-auto mb-10 shadow-2xl rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
                <img 
                  src={slides[currentSlide].image} 
                  alt={slides[currentSlide].title} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 mx-auto rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center mb-10 border border-gray-100 dark:border-gray-800">
                {React.createElement(slides[currentSlide].icon!, { 
                  className: "w-10 h-10 text-black dark:text-white" 
                })}
              </div>
            )}
            
            <h2 className="text-2xl md:text-3xl font-bold text-black dark:text-white mb-4 leading-tight">
              {slides[currentSlide].title}
            </h2>
            <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed font-medium max-w-xs mx-auto">
              {slides[currentSlide].desc}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-8 relative z-10 w-full max-w-md mx-auto">
        {/* Progress Indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, idx) => (
            <div 
              key={idx}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === currentSlide 
                  ? 'w-6 bg-black dark:bg-white' 
                  : 'w-1.5 bg-gray-200 dark:bg-gray-800'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-base rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {currentSlide === slides.length - 1 ? (
            <>Get Started <CheckCircle className="w-4 h-4" /></>
          ) : (
            <>Next <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default WelcomeFlow;
