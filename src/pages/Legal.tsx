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
  <LegalLayout title="About OG Prompts" icon={Users}>
    <p>
      OG Prompts is the ultimate prompt library designed to help you get high-quality results from AI tools like ChatGPT and image generators. 
      We provide structured, proven prompts for personality building, product photoshoots, branding, business, finance, sales, and solopreneurs.
    </p>
    <p>
      Our mission is to democratize high-level prompt engineering. Whether you are a beginner or an advanced user, OG Prompts saves you time and ensures consistent, professional outputs.
    </p>
    <p>
      Created by <strong>Kartik Kumawat & Akshita Vashist</strong>, OG Prompts is built for creators, by creators.
    </p>
  </LegalLayout>
);

export const Privacy = () => (
  <LegalLayout title="Privacy Policy" icon={Shield}>
    <p className="text-sm text-slate-400">Last updated: January 2025</p>
    
    <div className="space-y-6">
      <section>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Information We Collect</h3>
        <p>We collect minimal information necessary to provide our services. This includes your email address for account creation and any prompts or images you voluntarily upload.</p>
      </section>

      <section>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. How We Use Your Information</h3>
        <p>Your information is used to manage your account, process payments (via secure third-party processors), and improve our prompt library. We do not sell your personal data.</p>
      </section>

      <section>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. AI Processing</h3>
        <p>Images uploaded for analysis are processed by AI models to generate prompts. These images are not permanently stored for training purposes unless explicitly stated.</p>
      </section>
    </div>
  </LegalLayout>
);

export const Terms = () => (
  <LegalLayout title="Terms of Service" icon={FileText}>
    <p className="text-sm text-slate-400">Last updated: January 2025</p>
    
    <div className="space-y-6">
      <section>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Acceptance of Terms</h3>
        <p>By accessing OG Prompts, you agree to these terms. If you do not agree, please do not use our services.</p>
      </section>

      <section>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Pro Plan & Refunds</h3>
        <p>The Pro Lifetime plan is a one-time payment granting access to premium features. We offer a 7-day money-back guarantee if you are unsatisfied with the service.</p>
      </section>

      <section>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. User Content</h3>
        <p>You retain rights to the content you generate. However, by uploading prompts to the public library, you grant OG Prompts a license to display and share them.</p>
      </section>
    </div>
  </LegalLayout>
);
