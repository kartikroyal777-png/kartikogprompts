import React from 'react';
import { X, User, Calendar, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Subscriber, EarningEntry } from '../types';

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'subscribers' | 'earnings';
  subscribers?: Subscriber[];
  earnings?: EarningEntry[];
}

export default function UserListModal({ isOpen, onClose, title, type, subscribers, earnings }: UserListModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 dark:border-slate-800 flex flex-col max-h-[80vh]"
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {type === 'subscribers' ? <User className="w-5 h-5 text-purple-500" /> : <DollarSign className="w-5 h-5 text-green-500" />}
              {title}
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-0 overflow-y-auto flex-1">
            {type === 'subscribers' && subscribers && (
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {subscribers.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No subscribers yet.</div>
                ) : (
                  subscribers.map((sub, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-sm">
                          {sub.user_id.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                            {sub.user_id.substring(0, 8)}...
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(sub.unlocked_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {type === 'earnings' && earnings && (
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {earnings.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No earnings history yet.</div>
                ) : (
                  earnings.map((earn, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-sm">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {earn.prompt_title}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            From: {earn.sender_id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 dark:text-green-400">+{earn.amount} Credits</p>
                        <p className="text-xs text-slate-400">{new Date(earn.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
