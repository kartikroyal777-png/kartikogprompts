import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Is this tool accurate?",
      answer: "Our AI is trained on thousands of rated images using modern aesthetic standards. However, beauty is subjective! Use this as a fun guide, not a definitive judgment."
    },
    {
      question: "Is my photo stored?",
      answer: "We process your photo for analysis. If you choose not to publish to the leaderboard, it is deleted from temporary storage. If you publish, we store it securely to display on the leaderboard."
    },
    {
      question: "What do the scores mean?",
      answer: "Scores range from 0-100. Average is ~50. Anything above 80 is considered exceptional model-tier aesthetics according to AI standards."
    },
    {
      question: "Can I improve my score?",
      answer: "Yes! Check the 'Improvement Tips' above. Better lighting, angles, and styling can drastically change your score even minutes later."
    },
    {
      question: "What if the tool doesn't work?",
      answer: "Ensure your face is clearly visible, well-lit, and not covered by masks or heavy filters. The AI needs clear data to work."
    },
    {
      question: "Is this tool really free?",
      answer: "Yes, the 'Rate Me' analysis is 100% free. You can upload and analyze as many times as you like."
    },
    {
      question: "Does the AI work for all ethnicities and face shapes?",
      answer: "We strive for inclusivity. The AI is trained on a diverse global dataset to recognize beauty across all cultures and features without bias."
    }
  ];

  return (
    <div className="py-12 max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <HelpCircle className="w-8 h-8 text-sky-500" />
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all hover:border-sky-500/30"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 text-left flex justify-between items-center"
            >
              <span className="font-bold text-slate-800 dark:text-slate-200">{faq.question}</span>
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-sky-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="px-6 pb-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed border-t border-slate-100 dark:border-slate-800/50 pt-4">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
