import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusSquare, BookOpen, User } from 'lucide-react';
import { cn } from '../lib/utils';

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: PlusSquare, label: 'Upload', path: '/upload' },
    { icon: BookOpen, label: 'Ebook', path: '/ebook' },
    { icon: User, label: 'About', path: '/about' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-slate-800 pb-safe z-50 rounded-t-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200",
                isActive ? "text-sky-500 dark:text-sky-400" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
              )}
            >
              {/* Removed fill-current to keep it outline style */}
              <item.icon className={cn("w-6 h-6 transition-transform", isActive && "scale-110 stroke-[2.5px]")} />
              <span className={cn("text-[10px] font-medium", isActive && "font-bold")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
