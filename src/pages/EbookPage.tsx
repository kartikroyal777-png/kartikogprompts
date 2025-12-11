import React from 'react';
import { CheckCircle, Download, MessageCircle, Shield, Star, Zap, Check, TrendingUp, Quote, AlertCircle } from 'lucide-react';
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

  const valueItems = [
    { name: "Veo 3 subscription value", price: "₹3,500+" },
    { name: "Sora-level video tools", price: "₹4,000+" },
    { name: "Midjourney membership", price: "₹2,400+" },
    { name: "Dualite Alpha Access Guide", price: "₹3,000+" },
    { name: "Additional premium tools", price: "₹2,000+" },
  ];

  const reviews = [
    {
      name: "Rohit",
      role: "Freelancer",
      text: "Saved me ₹12,000 in the first month alone.",
      rating: 5
    },
    {
      name: "Nishant",
      role: "Visual Creator",
      text: "The Dualite Alpha guide in this eBook is insane. I had no idea this tool could be accessed legally without paying for full access. Now I use it daily for vibe-coding and aesthetic scenes.",
      rating: 5,
      highlight: true
    },
    {
      name: "Aditi",
      role: "Content Creator",
      text: "I created 40+ AI videos without subscriptions. Worth every rupee.",
      rating: 5
    },
    {
      name: "Riya",
      role: "Aesthetic Editor",
      text: "I’ve always loved Dualite but couldn’t afford monthly subscriptions. The method in this eBook helped me use it completely free using official channels. Zero hacks, 100% safe.",
      rating: 5,
      highlight: true
    },
    {
      name: "Abhay",
      role: "Short-Form Editor",
      text: "The vibe-coding examples are next level. I recreated the exact Dualite Alpha moods I see on TikTok and Instagram. The workflow is easy even for beginners.",
      rating: 5
    },
    {
      name: "Varun",
      role: "Student",
      text: "The legal access methods here are better than any YouTube guide.",
      rating: 5
    },
    {
      name: "Shreya",
      role: "Social Media Manager",
      text: "I use the workflows daily for client work. Pure gold.",
      rating: 5
    },
    {
      name: "Divya",
      role: "Agency Owner",
      text: "The best investment I’ve made in 2025. Saves money and loads of time.",
      rating: 5
    },
    {
      name: "Zoya",
      role: "Student Creator",
      text: "This book made AI content creation affordable for me. Zero monthly subscriptions now.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
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
                Unlock Premium AI Tools <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">Legally for ₹0</span>
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                Stop paying expensive monthly subscriptions. This eBook reveals the exact legal methods creators use to access Veo 3, Sora 2, and Midjourney for free.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="https://www.instagram.com/ogduo.prompts/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center items-center px-8 py-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-lg shadow-lg shadow-sky-500/20 transition-all hover:-translate-y-1"
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
                <div className="absolute -inset-4 bg-gradient-to-br from-sky-500 to-blue-600 rounded-[2rem] blur-3xl opacity-30 animate-pulse" />
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
                <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center mb-6 text-sky-600 dark:text-sky-400">
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

      {/* Value Breakdown Section */}
      <div className="py-24 bg-slate-50 dark:bg-slate-900 transition-colors duration-300 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left: Value List */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-sm font-bold mb-4">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Massive ROI
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight mb-4">
                  This eBook Saves You More Than <span className="text-sky-500">₹10,000 Instantly</span>
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Why pay monthly subscriptions when you can get the same results for free? Here is the real value of what you're getting:
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
                {valueItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between p-5 ${idx !== valueItems.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">{item.price}</span>
                  </div>
                ))}
                <div className="bg-slate-50 dark:bg-slate-950/50 p-5 flex justify-between items-center border-t border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-lg text-slate-900 dark:text-white">Total Real Value</span>
                  <span className="font-bold text-xl text-slate-900 dark:text-white decoration-sky-500 underline decoration-4 underline-offset-4">₹14,900+</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Pricing Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-blue-600 rounded-3xl blur-xl opacity-20 transform rotate-3"></div>
              <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-2xl text-center">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg shadow-sky-500/30 whitespace-nowrap">
                    ⚡ Limited-Time Offer
                  </span>
                </div>

                <h3 className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider text-sm mt-4 mb-2">Your Price Today</h3>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">₹200</span>
                  <span className="text-lg text-slate-400 line-through font-medium">₹10,000</span>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Instant Download</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Lifetime Access</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Free Updates</span>
                  </div>
                </div>

                <a 
                  href="https://www.instagram.com/ogduo.prompts/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 transition-all hover:-translate-y-1 mb-4"
                >
                  Get Access Now
                </a>
                
                <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Price increasing soon
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="py-24 bg-white dark:bg-gray-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Trusted by <span className="text-sky-500">1,000+ Creators</span> Already
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Join the community of creators who are saving thousands on AI tools every month.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`p-6 rounded-2xl border ${
                  review.highlight 
                    ? 'bg-sky-50 dark:bg-sky-900/10 border-sky-200 dark:border-sky-800' 
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                } hover:shadow-lg transition-shadow`}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <div className="mb-6 relative">
                  <Quote className="absolute -top-2 -left-2 w-8 h-8 text-sky-500/10 dark:text-sky-400/10 transform -scale-x-100" />
                  <p className={`relative z-10 text-sm leading-relaxed ${
                    review.highlight ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    "{review.text}"
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm">
                    {review.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{review.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{review.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
