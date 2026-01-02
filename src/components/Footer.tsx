import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Send, Sparkles, Shield, Box } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 py-12 pb-24 md:pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-black dark:text-white" />
              <span className="text-xl font-bold text-black dark:text-white">OGPrompts</span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs">
              The #1 free platform to discover and share high-quality AI art prompts. 
              Built by creators, for creators.
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
            <h3 className="font-bold text-black dark:text-white mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link to="/prompts" className="hover:text-black dark:hover:text-white transition-colors">Browse Prompts</Link></li>
              <li><Link to="/product-prompts" className="hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">Product Prompts <Box className="w-3 h-3" /></Link></li>
              <li><Link to="/image-to-json" className="hover:text-black dark:hover:text-white transition-colors">Image to JSON</Link></li>
              <li><Link to="/upload" className="hover:text-black dark:hover:text-white transition-colors">Upload Prompt</Link></li>
              <li><Link to="/buy-credits" className="hover:text-black dark:hover:text-white transition-colors">Buy Credits</Link></li>
              <li><Link to="/profile" className="hover:text-black dark:hover:text-white transition-colors">My Profile</Link></li>
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
