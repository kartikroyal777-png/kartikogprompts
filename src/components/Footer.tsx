import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Send, Sparkles, Shield, Box, Zap, BookOpen } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 py-12 pb-24 md:pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-3 group mb-4">
              <div className="bg-black dark:bg-white p-1.5 rounded-xl shadow-lg border border-white/10 dark:border-black/10">
                <img 
                  src="https://ik.imagekit.io/7iiagrttq/Untitled%20design%20(2).png" 
                  alt="OG Prompts" 
                  className="w-6 h-6 object-contain invert dark:invert-0" 
                />
              </div>
              <span className="text-xl font-bold text-black dark:text-white">OGPrompts</span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs">
              Unlock the full potential of AI Tools. The ultimate library for creators, businesses, and solopreneurs.
            </p>
            <div className="flex gap-4 mt-6">
              <a 
                href="https://www.instagram.com/kartikkumawat.ai/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-gray-100 dark:bg-gray-900 rounded-full hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://t.me/kartikogprompts" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-gray-100 dark:bg-gray-900 rounded-full hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
              >
                <Send className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-black dark:text-white mb-4">Features</h3>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link to="/prompts" className="hover:text-black dark:hover:text-white transition-colors">Personality Prompts</Link></li>
              <li><Link to="/product-prompts" className="hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">Product Prompts <Box className="w-3 h-3" /></Link></li>
              <li><Link to="/super-prompts" className="hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">Super Prompts <Zap className="w-3 h-3" /></Link></li>
              <li><Link to="/tools" className="hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">Prompt Enhancer <Sparkles className="w-3 h-3" /></Link></li>
              <li><Link to="/tools" className="hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">Guide Book <BookOpen className="w-3 h-3" /></Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-black dark:text-white mb-4">Legal & Help</h3>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link to="/instructions" className="hover:text-black dark:hover:text-white transition-colors">How to Use</Link></li>
              <li><Link to="/about" className="hover:text-black dark:hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/privacy" className="hover:text-black dark:hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-black dark:hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p>© {new Date().getFullYear()} OGPrompts. All rights reserved.</p>
          <Link to="/admin" className="flex items-center gap-1 hover:text-black dark:hover:text-white transition-colors">
            <Shield className="w-3 h-3" />
            Admin Panel
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
