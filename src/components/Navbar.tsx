import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Upload, Sun, Moon, Coins, LogIn, PlusSquare, User, Flame } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

const Navbar = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, wallet, profile } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = React.useState(false);

  // Ensure 0 is displayed if wallet exists but balance is 0, or default to 0
  const creditBalance = wallet?.balance_credits ?? 0;

  return (
    <>
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border border-gray-200 dark:border-slate-800 rounded-2xl shadow-lg transition-all duration-300">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <div className="relative w-8 h-8 flex items-center justify-center bg-sky-500 rounded-lg shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
                 <Sparkles className="h-5 w-5 text-white fill-white" />
              </div>
              <span className="text-xl font-bold text-slate-800 dark:text-white whitespace-nowrap">
                <span className="text-sky-500">OG</span> Prompts
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {[
                { name: 'Prompts', path: '/prompts' },
                { name: 'Ebook', path: '/ebook' },
                { 
                  name: 'Rate Me', 
                  path: '/rate-me',
                  badge: true 
                },
                { name: 'Buy Credits', path: '/buy-credits' },
                ...(user ? [{ name: 'Profile', path: '/profile' }] : []),
              ].map((item) => (
                <Link 
                  key={item.path}
                  to={item.path} 
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-sky-500 relative flex items-center gap-1",
                    location.pathname === item.path 
                      ? "text-sky-500 dark:text-sky-400" 
                      : "text-slate-600 dark:text-slate-300"
                  )}
                >
                  {item.name}
                  {item.badge && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse shadow-lg shadow-red-500/20">
                      <Flame className="w-2.5 h-2.5 fill-current" />
                      HOT
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Credits Display - Always show if user is logged in, even if 0 */}
              {user && (
                <Link 
                  to="/buy-credits" 
                  className="order-1 md:order-none flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs sm:text-sm font-bold border border-amber-200 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                >
                  <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                  {creditBalance}
                </Link>
              )}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="order-2 md:order-none p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              
              {/* Mobile Profile Icon (New) */}
              {user && (
                <Link 
                  to="/profile"
                  className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 order-2"
                >
                  <User className="w-6 h-6" />
                </Link>
              )}

              {/* Removed Mobile Upload Icon as requested */}

              {user ? (
                 <Link
                  to="/upload"
                  className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 active:scale-95 order-4"
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </Link>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-gray-200 text-white dark:text-slate-900 text-sm font-bold rounded-full transition-all shadow-lg active:scale-95 order-4"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
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
