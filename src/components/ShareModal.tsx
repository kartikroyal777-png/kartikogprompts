import React, { useState } from 'react';
import { X, Link as LinkIcon, Check, MessageCircle, Twitter, Facebook, Linkedin, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export default function ShareModal({ isOpen, onClose, title, url }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const brandMessage = `Check out this amazing AI prompt "${title}" on OGPrompts! 🚀\n\nGet it here:`;
  const encodedText = encodeURIComponent(brandMessage);
  const encodedUrl = encodeURIComponent(url);

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500',
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`
    },
    {
      name: 'Twitter / X',
      icon: Twitter,
      color: 'bg-black',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-blue-500',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    }
  ];

  const handleCopy = async () => {
    // Copy just the URL for the "Copy Link" button
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-200 dark:border-slate-800 z-10"
          >
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Share Prompt</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-5 gap-4 mb-6">
                {shareLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className={`w-12 h-12 rounded-full ${link.color} flex items-center justify-center text-white shadow-lg transform transition-transform group-hover:scale-110`}>
                      <link.icon className="w-5 h-5 fill-current" />
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium text-center leading-tight">{link.name}</span>
                  </a>
                ))}
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                  Copy Link
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800">
                  <LinkIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <input 
                    type="text" 
                    readOnly 
                    value={url}
                    className="flex-1 bg-transparent text-sm text-slate-600 dark:text-slate-300 outline-none truncate font-mono"
                  />
                  <button
                    onClick={handleCopy}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      copied 
                        ? 'bg-green-500 text-white' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {copied ? <Check className="w-3 h-3" /> : null}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
