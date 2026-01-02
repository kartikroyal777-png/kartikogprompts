import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusSquare, Box, LayoutGrid, Coins, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const BottomNav = () => {
  const location = useLocation();
  const { profile } = useAuth();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: LayoutGrid, label: 'Prompts', path: '/prompts' },
    { icon: Box, label: 'Products', path: '/product-prompts' },
    { icon: Sparkles, label: 'AI JSON', path: '/image-to-json' },
    profile?.creator_badge 
      ? { icon: PlusSquare, label: 'Upload', path: '/upload' }
      : { icon: Coins, label: 'Credits', path: '/buy-credits' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-black/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200",
                isActive ? "text-black dark:text-white" : "text-gray-400 dark:text-gray-600"
              )}
            >
              <item.icon className={cn("w-6 h-6 transition-transform", isActive && "scale-110")} />
              <span className={cn("text-[10px] font-medium", isActive && "font-bold")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
