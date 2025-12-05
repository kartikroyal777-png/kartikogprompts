import React from 'react';
import { CheckCircle, Download, MessageCircle, Shield, Star, Zap, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EbookPage() {
  // Google Drive direct image link
  const ebookImage = "https://lh3.googleusercontent.com/d/1m8rI80MB2hEuKdIk-N7KBb11m7INvj0m";

  const features = [
    {
      icon: Shield,
      title: "Legal Access Methods",
      desc: "Step-by-step methods to use Veo 3, Sora 2 Pro & Midjourney using official credits & trials."
    },
    {
      icon: Zap,
      title: "Unlimited Usage",
      desc: "How to rotate platforms, resets, free credits, research portals & legal mirrors."
    },
    {
      icon: Star,
      title: "High-Quality Alternatives",
      desc: "Free tools matching premium quality for images, videos, thumbnails, ads."
    },
    {
      icon: CheckCircle,
      title: "Zero-Cost Workflows",
      desc: "Blueprints to create YouTube videos, Reels, and Fiverr gigs without spending a dime."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-200 dark:bg-grid-slate-700/20 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(0,0,0,0.2),rgba(0,0,0,0.5))]" />
        
        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700/50 font-medium text-sm">
                <Star className="w-4 h-4 mr-2 fill-current" />
                Save ₹10,000+ Every Year
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Unlock Premium AI Tools <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Legally for ₹0</span>
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                Stop paying expensive monthly subscriptions. This eBook reveals the exact legal methods creators use to access Veo 3, Sora 2, and Midjourney for free.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="https://www.instagram.com/kartik.ogprompts/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center items-center px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-lg shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-1"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  DM to Unlock (₹200)
                </a>
                <button className="inline-flex justify-center items-center px-8 py-4 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:-translate-y-1">
                  <Download className="w-5 h-5 mr-2" />
                  Buy Instantly
                </button>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-900" />
                  ))}
                </div>
                <p>Trusted by 1,000+ creators</p>
              </div>
            </motion.div>

            {/* Right Image */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative flex justify-center"
            >
              <div className="relative w-72 sm:w-96 aspect-[2/3]">
                <div className="absolute -inset-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-[2rem] blur-3xl opacity-30 animate-pulse" />
                <img 
                  src={ebookImage}
                  alt="AI Access Mastery eBook"
                  className="relative w-full h-full object-cover rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 transform hover:scale-105 transition-transform duration-500"
                />
                
                {/* Floating Badge */}
                <div className="absolute -bottom-6 -right-6 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 animate-bounce">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Value</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">₹10,000+</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20 bg-white dark:bg-gray-800/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">What's Inside?</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Comprehensive guides and secret workflows to supercharge your content creation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
