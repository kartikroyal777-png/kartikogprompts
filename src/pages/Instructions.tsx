import React from 'react';
import { Terminal, ArrowRight, Image as ImageIcon, Cpu } from 'lucide-react';

const Instructions = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 py-12 px-4 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">How to Generate 4K Images Free</h1>
        <p className="text-xl text-slate-500 dark:text-slate-400 mb-12">
          Use our prompts with Seedream to create cinematic masterpieces.
        </p>

        <div className="space-y-12">
          {[
            {
              step: "01",
              title: "Visit Luma AI Arena",
              desc: "Navigate to lmarena.ai in your web browser.",
              icon: Terminal
            },
            {
              step: "02",
              title: "Choose Direct Chat",
              desc: "From the options at the top, select 'Direct Chat' to start a one-on-one session.",
              icon: ArrowRight
            },
            {
              step: "03",
              title: "Select Image Generation",
              desc: "Click the image icon inside the prompt box to switch to image generation mode.",
              icon: ImageIcon
            },
            {
              step: "04",
              title: "Pick Seedream Model",
              desc: "From the list of available models above the prompt box, find and select 'Seedream'.",
              icon: Cpu
            },
            {
              step: "05",
              title: "Paste & Generate",
              desc: "Copy any prompt from OGPrompts, paste it there, and hit Generate!",
              icon: ArrowRight
            }
          ].map((item, i) => (
            <div key={i} className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold text-lg">
                {item.step}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800">
          <h4 className="font-bold text-slate-900 dark:text-white mb-2">Pro Tip</h4>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Always use the "Upscale" option if available to get the full 4K resolution for your generated images.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Instructions;
