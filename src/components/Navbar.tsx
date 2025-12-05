import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Upload, Sun, Moon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border border-gray-200 dark:border-slate-800 rounded-2xl shadow-lg transition-all duration-300">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8 flex items-center justify-center bg-sky-500 rounded-lg shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
               <Sparkles className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300">
              OGPrompts
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { name: 'Prompts', path: '/prompts' },
              { name: 'Ebook', path: '/ebook' },
              { name: 'Instructions', path: '/instructions' },
            ].map((item) => (
              <Link 
                key={item.path}
                to={item.path} 
                className={cn(
                  "text-sm font-medium transition-colors hover:text-sky-500",
                  location.pathname === item.path 
                    ? "text-sky-500 dark:text-sky-400" 
                    : "text-slate-600 dark:text-slate-300"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Upload Icon Button (Visible ONLY on mobile/tablet now) */}
             <Link
              to="/upload"
              className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Upload Prompt"
            >
              <Upload className="w-5 h-5" />
            </Link>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Desktop Upload Button (Text version) */}
            <Link
              to="/upload"
              className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 active:scale-95"
            >
              <Upload className="h-4 w-4" />
              Upload Prompt
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
