import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Box, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface WelcomeFlowProps {
  onComplete: () => void;
}

const WelcomeFlow: React.FC<WelcomeFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'splash' | 'onboarding'>('splash');
  const [currentSlide, setCurrentSlide] = useState(0);
  const { theme } = useTheme();

  useEffect(() => {
    // Splash screen timer
    const timer = setTimeout(() => {
      // Check if user has seen onboarding
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
      if (hasSeenOnboarding) {
        onComplete();
      } else {
        setStep('onboarding');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      localStorage.setItem('hasSeenOnboarding', 'true');
      onComplete();
    }
  };

  const slides = [
    {
      icon: Sparkles,
      title: "Unlimited AI Prompts",
      desc: "Access thousands of high-quality prompts for Midjourney, Flux, and more. Totally free.",
      color: "text-sky-500",
      bg: "bg-sky-500/10"
    },
    {
      icon: Box,
      title: "Product Photography",
      desc: "Specialized prompts for brands and agencies to create stunning product shots instantly.",
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
    {
      icon: Zap,
      title: "Image to JSON",
      desc: "Upload any image and get a precise, technical JSON prompt to recreate the style.",
      color: "text-amber-500",
      bg: "bg-amber-500/10"
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
        <div className="flex flex-col items-center justify-center gap-8">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360] 
            }}
            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
            className="w-24 h-24 rounded-3xl bg-black dark:bg-white flex items-center justify-center shadow-2xl"
          >
            <img 
              src="https://ik.imagekit.io/7iiagrttq/Untitled%20design%20(2).png" 
              alt="Logo" 
              className="w-12 h-12 object-contain invert dark:invert-0" 
            />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <h1 className="text-3xl font-black text-black dark:text-white tracking-tight">OG Prompts</h1>
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
      className="fixed inset-0 z-[100] bg-white dark:bg-black flex flex-col"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="text-center max-w-sm"
          >
            <div className={`w-24 h-24 mx-auto rounded-3xl ${slides[currentSlide].bg} flex items-center justify-center mb-8 shadow-xl`}>
              {React.createElement(slides[currentSlide].icon, { 
                className: `w-12 h-12 ${slides[currentSlide].color}` 
              })}
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">
              {slides[currentSlide].title}
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
              {slides[currentSlide].desc}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-8 relative z-10">
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, idx) => (
            <div 
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide 
                  ? 'w-8 bg-black dark:bg-white' 
                  : 'w-2 bg-gray-200 dark:bg-gray-800'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-lg rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {currentSlide === slides.length - 1 ? (
            <>Get Started <CheckCircle className="w-5 h-5" /></>
          ) : (
            <>Next <ArrowRight className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default WelcomeFlow;
