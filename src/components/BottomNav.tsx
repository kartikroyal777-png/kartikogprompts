import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Box, LayoutGrid, Zap, Wrench, Crown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const BottomNav = () => {
  const location = useLocation();
  const { isPro } = useAuth();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: LayoutGrid, label: 'Prompts', path: '/prompts' },
    { icon: Zap, label: 'Super', path: '/super-prompts' },
    { icon: Box, label: 'Products', path: '/product-prompts' },
    { icon: Wrench, label: 'Tools', path: '/tools' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-black/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe z-50">
      {/* Mobile Upgrade Banner - Only if not Pro */}
      {!isPro && (
        <Link 
          to="/pricing"
          className="absolute -top-10 left-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold py-2 text-center flex items-center justify-center gap-2"
        >
          <Crown className="w-3 h-3 fill-current" />
          Upgrade to Pro - Lifetime Access
        </Link>
      )}
      
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
