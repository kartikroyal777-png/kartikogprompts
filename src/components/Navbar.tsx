import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, LogIn, User, Box, Zap, Crown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

const Navbar = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, profile, isPro } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = React.useState(false);

  // Updated Logo URL
  const LOGO_URL = "https://cdn.phototourl.com/uploads/2026-01-16-b1550510-f87e-4751-b08e-9d4421d7a041.jpg";

  const navLinks = [
    { name: 'Prompts', path: '/prompts' },
    { name: 'Super Prompts', path: '/super-prompts', icon: Zap },
    { name: 'Product Prompts', path: '/product-prompts', icon: Box },
    { name: 'Tools', path: '/tools' },
  ];

  return (
    <>
      <nav className="fixed top-4 left-4 right-4 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group shrink-0">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800">
                <img 
                  src={LOGO_URL} 
                  alt="OG Prompts" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <span className="text-lg sm:text-xl font-bold text-black dark:text-white tracking-tight block">
                OG Prompts
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((item) => (
                <Link 
                  key={item.path}
                  to={item.path} 
                  className={cn(
                    "text-sm font-bold transition-colors hover:text-black dark:hover:text-white flex items-center gap-1.5",
                    location.pathname === item.path 
                      ? "text-black dark:text-white" 
                      : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-3">
              
              {/* Upgrade Button (Always visible if not Pro) */}
              {!isPro && (
                <Link 
                  to="/pricing" 
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black border border-transparent rounded-full text-xs font-bold hover:opacity-90 transition-all shadow-sm"
                >
                  <Crown className="w-3.5 h-3.5 fill-current" />
                  Upgrade
                </Link>
              )}

              {/* Theme Toggle - Desktop Only (Moved to Profile for Mobile) */}
              <button
                onClick={toggleTheme}
                className="hidden md:block p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 text-black dark:text-white transition-colors"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              
              {/* Profile / Auth */}
              {user ? (
                <Link 
                  to="/profile"
                  className="p-1 rounded-full border border-gray-200 dark:border-gray-800 hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                      {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                          <User className="w-4 h-4 text-gray-500" />
                      )}
                  </div>
                </Link>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black border border-gray-200 text-sm font-bold rounded-xl transition-all hover:bg-gray-100 active:scale-95"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};

export default Navbar;
