import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function EbookPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has seen the popup (Updated key to force reset for testing)
    const hasSeenPopup = localStorage.getItem('hasSeenEbookPopup_v2');
    
    if (!hasSeenPopup) {
      // Show popup after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('hasSeenEbookPopup_v2', 'true');
  };

  // Google Drive direct image link
  const ebookImage = "https://lh3.googleusercontent.com/d/1m8rI80MB2hEuKdIk-N7KBb11m7INvj0m";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-800"
          >
            <button 
              onClick={handleClose}
              className="absolute top-3 right-3 p-2 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded-full transition-colors z-10 text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-2/5 bg-gradient-to-br from-sky-500 to-blue-600 p-4 flex items-center justify-center">
                <img 
                  src={ebookImage} 
                  alt="AI Access Mastery eBook" 
                  className="w-3/4 md:w-full shadow-lg rounded-md transform rotate-[-5deg] hover:rotate-0 transition-transform duration-500"
                />
              </div>
              
              <div className="w-full md:w-3/5 p-6 flex flex-col justify-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Stop Paying for AI Tools!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Unlock Veo 3, Sora 2, Midjourney & more legally without monthly subscriptions. Save ₹10,000+ today.
                </p>
                
                <div className="space-y-3">
                  <Link 
                    to="/ebook" 
                    onClick={handleClose}
                    className="block w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-center font-medium rounded-lg transition-colors shadow-lg shadow-sky-500/20"
                  >
                    Get Access Now
                  </Link>
                  <button 
                    onClick={handleClose}
                    className="block w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    No thanks, I'll pay full price
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
