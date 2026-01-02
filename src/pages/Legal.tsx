import React from 'react';
import { Users, BookOpen, ShieldAlert, Mail, CheckCircle, Sparkles, Info, Shield, FileText } from 'lucide-react';

const LegalLayout = ({ title, icon: Icon, children }: { title: string, icon?: any, children: React.ReactNode }) => (
  <div className="min-h-screen bg-white dark:bg-slate-950 py-12 px-4 pt-28 pb-12 transition-colors duration-300">
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 border border-gray-200 dark:border-gray-800 shadow-xl">
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100 dark:border-gray-800">
          {Icon && (
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-black dark:text-white">
              <Icon className="w-8 h-8" />
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">{title}</h1>
        </div>
        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 space-y-6">
          {children}
        </div>
      </div>
    </div>
  </div>
);

export const About = () => (
  <div className="min-h-screen bg-white dark:bg-slate-950 py-16 px-4 pt-28 pb-16 transition-colors duration-300">
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/20 rounded-3xl mb-6 shadow-lg shadow-sky-500/10 transform rotate-3">
          <Sparkles className="w-10 h-10 text-sky-600 dark:text-sky-400" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
          About <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">OG Prompts</span>
        </h1>
      </div>

      {/* Main Content Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 mb-12 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
            <Users className="w-6 h-6 text-sky-500" />
            Who We Are
          </h2>
          <p className="text-xl text-slate-700 dark:text-slate-300 mb-8 leading-relaxed font-medium">
            Hi! We’re <span className="text-sky-500 font-bold">Kartik Kumawat & Akshita Vashist</span> — creators of OG Prompts.
          </p>
          
          <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-6 mb-8 border border-slate-100 dark:border-slate-800">
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed italic">
              "We built OG Prompts with one goal: <strong className="text-slate-900 dark:text-white not-italic">Make high-quality AI prompts accessible to everyone, for free.</strong>"
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {[
              "No sign-up required",
              "No subscriptions",
              "No hidden fees",
              "Curated library of Midjourney & Seedream prompts"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">{item}</span>
              </div>
            ))}
          </div>

          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Every prompt is hand-picked for quality, creativity, and real-world usefulness. Our platform is growing every day with new prompts from creators worldwide.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {/* Ebook Section */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/10 rounded-[2rem] p-8 border border-amber-100 dark:border-amber-900/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BookOpen className="w-24 h-24 text-amber-600" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                <BookOpen className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">About the eBook</h2>
            </div>
            
            <p className="text-slate-700 dark:text-slate-300 mb-6 font-medium">
              To support the project and give creators even more value, we released our premium eBook:
            </p>
            
            <div className="bg-white/60 dark:bg-black/20 rounded-xl p-4 mb-6 backdrop-blur-sm">
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                “AI Access Mastery — Use Veo 3, Veo 3.1, Sora 2 Pro & Midjourney Legally Without Paid Subscriptions.”
              </p>
            </div>
            
            <ul className="space-y-3 mb-8 text-sm text-slate-600 dark:text-slate-400">
              {["Legal access methods", "Free credit strategies", "Prompt templates", "Creator earning workflows"].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {item}
                </li>
              ))}
            </ul>
            
            <div className="flex justify-between items-center pt-6 border-t border-amber-200 dark:border-amber-900/30">
              <div>
                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Real Value</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">₹10,000+</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Your Price</div>
                <div className="text-lg font-bold text-amber-600 dark:text-amber-500">20 Credits</div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer Section */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg">
              <ShieldAlert className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Disclaimer</h2>
          </div>
          
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 flex-grow">
            <p className="flex gap-3">
              <Info className="w-5 h-5 text-sky-500 flex-shrink-0" />
              OG Prompts shares educational content and legal AI access methods only.
            </p>
            <p className="flex gap-3">
              <Info className="w-5 h-5 text-sky-500 flex-shrink-0" />
              We do not provide or support illegal bypasses, cracks, or pirated access.
            </p>
            <p className="flex gap-3">
              <Info className="w-5 h-5 text-sky-500 flex-shrink-0" />
              All methods use official trials, developer programs, and public tools.
            </p>
            <p className="flex gap-3">
              <Info className="w-5 h-5 text-sky-500 flex-shrink-0" />
              Users must follow each AI tool’s Terms of Service.
            </p>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-400 italic">
              Monetization links are user-generated; OG Prompts is not responsible for third-party content.
            </p>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="text-center p-10 bg-sky-50 dark:bg-sky-900/10 rounded-[2.5rem] border border-sky-100 dark:border-sky-900/20">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-sm mb-6">
          <Mail className="w-8 h-8 text-sky-500" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Need Help?</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">Just message us anytime</p>
        <a 
          href="mailto:support@ogprompts.com" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-bold rounded-xl shadow-sm hover:shadow-md transition-all"
        >
          support@ogprompts.com
        </a>
        <div className="mt-10 flex items-center justify-center gap-2 text-slate-900 dark:text-white font-medium">
          <span>Happy prompting!</span>
          <span className="text-slate-300 dark:text-slate-600">—</span>
          <span>Kartik Kumawat & Akshita Vashist</span>
        </div>
      </div>
    </div>
  </div>
);

export const Privacy = () => (
  <LegalLayout title="Privacy Policy" icon={Shield}>
    <p className="text-sm text-slate-400">Last updated: December 5, 2025</p>
    
    <div className="space-y-6">
      <section>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. What we collect</h3>
        <p>Uploaders: Prompt text, the URL you paste for monetization, creator name, and Instagram handle (if provided). Standard server logs like IP & browser info are also collected to prevent spam.</p>
        <p className="mt-2">Visitors: Nothing. We use no cookies, no trackers, and no analytics. Your browsing is your business.</p>
      </section>

      <section>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Why we collect it</h3>
        <p>To keep the site running, prevent spam, and display your creator credit on your prompts.</p>
      </section>

      <section>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Third parties</h3>
        <p>Your pay-link (e.g., Adsterra) is embedded in your prompt's "Get Prompt" button. Their privacy policy applies after a visitor clicks that link.</p>
      </section>
    </div>
  </LegalLayout>
);

export const Terms = () => (
  <LegalLayout title="Terms of Service" icon={FileText}>
    <p className="text-sm text-slate-400">Last updated: December 5, 2025</p>
    
    <div className="space-y-6">
      <section>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Accepting these terms</h3>
        <p>By viewing or uploading anything on OG Prompts, you agree to these terms.</p>
      </section>

      <section>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Allowed content</h3>
        <p>Only text prompts and legitimate pay-links (no malware, no phishing, no adult content where prohibited).</p>
      </section>

      <section>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Monetization</h3>
        <p>You may insert one direct-link per prompt. We place zero fees; earnings are between you and your ad network.</p>
      </section>
    </div>
  </LegalLayout>
);
