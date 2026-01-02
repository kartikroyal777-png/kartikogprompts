import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Upload, Sun, Moon, Coins, LogIn, User, Box } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

const Navbar = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, wallet, profile } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = React.useState(false);

  const creditBalance = wallet?.balance_credits ?? 0;

  const navLinks = [
    { name: 'Prompts', path: '/prompts' },
    { name: 'Product Prompts', path: '/product-prompts', icon: Box },
    { name: 'Image to JSON', path: '/image-to-json' },
    { name: 'Buy Credits', path: '/buy-credits' },
  ];

  return (
    <>
      <nav className="fixed top-4 left-4 right-4 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            
            {/* Logo - Enhanced Visuals */}
            <Link to="/" className="flex items-center gap-3 group shrink-0">
              <div className="bg-gradient-to-br from-gray-900 to-black dark:from-white dark:to-gray-200 p-1.5 rounded-xl shadow-lg border border-white/10 dark:border-black/10 transition-transform group-hover:scale-105">
                <img 
                  src="https://ik.imagekit.io/7iiagrttq/Untitled%20design%20(2).png" 
                  alt="OG Prompts" 
                  className="w-5 h-5 object-contain invert dark:invert-0" 
                />
              </div>
              <span className="text-lg sm:text-xl font-bold text-black dark:text-white tracking-tight">
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
              
              {/* Credits - Visible on Mobile now */}
              {user && (
                <Link 
                  to="/buy-credits" 
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-900 text-black dark:text-white rounded-full text-xs font-bold border border-gray-200 dark:border-gray-800 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors glow-button"
                >
                  <Coins className="w-3.5 h-3.5 fill-current" />
                  {creditBalance}
                </Link>
              )}

              {/* Theme Toggle - Hidden on Mobile */}
              <button
                onClick={toggleTheme}
                className="hidden md:block p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 text-black dark:text-white transition-colors"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              
              {/* Profile / Auth */}
              {user ? (
                <div className="flex items-center gap-2">
                   <Link
                    to="/upload"
                    className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl transition-all hover:opacity-90 active:scale-95 glow-button"
                  >
                    <Upload className="h-4 w-4" />
                    Upload
                  </Link>
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
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl transition-all hover:opacity-90 active:scale-95 glow-button"
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
