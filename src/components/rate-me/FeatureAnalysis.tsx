import React from 'react';
import { motion } from 'framer-motion';
import { Scale, Activity, Shirt, Diamond, Eye, Zap, Triangle, TrendingUp, Lightbulb } from 'lucide-react';

const FeatureAnalysis = () => {
  const features = [
    {
      icon: Scale,
      title: "Symmetry",
      meaning: "Measures the balance between the left and right sides of your face. High symmetry is scientifically linked to perceived attractiveness and health.",
      tips: [
        "Practice facial yoga to tone uneven muscles.",
        "Chew food on both sides evenly.",
        "Sleep on your back to avoid pressure asymmetry."
      ]
    },
    {
      icon: Activity,
      title: "Jawline",
      meaning: "Analyzes the definition and sharpness of the mandible. A strong jawline indicates good bone structure and low body fat.",
      tips: [
        "Maintain good posture (tongue on roof of mouth/mewing).",
        "Lower body fat percentage through cardio.",
        "Stay hydrated to reduce water retention/bloating."
      ]
    },
    {
      icon: Shirt,
      title: "Outfit & Styling",
      meaning: "Evaluates color coordination, fit, and current fashion trends relative to the setting. Good styling enhances your overall presence.",
      tips: [
        "Use the 'Rule of Thirds' in layering clothes.",
        "Match colors to your skin undertone.",
        "Ensure clothes fit your body type perfectly (tailoring)."
      ]
    },
    {
      icon: Diamond,
      title: "Cheekbones",
      meaning: "Measures the prominence and height of the zygomatic arches. High cheekbones create flattering shadows and definition.",
      tips: [
        "Use contouring makeup to enhance shadow.",
        "Reduce sodium intake to decrease facial puffiness.",
        "Facial exercises like 'fish face' can help tone."
      ]
    },
    {
      icon: Eye,
      title: "Eyes",
      meaning: "Analyzes shape, brightness, and alertness. This includes the 'Hunter Eyes' vs 'Prey Eyes' metric regarding eyelid exposure.",
      tips: [
        "Get 7-8 hours of sleep to reduce dark circles.",
        "Use cold spoons/rollers to de-puff mornings.",
        "Groom eyebrows to frame the eyes better."
      ]
    },
    {
      icon: Zap,
      title: "Aura / Vibe",
      meaning: "An aggregate score of confidence, posture, and energy projected in the photo. It measures the 'X-Factor.'",
      tips: [
        "Smile with your eyes (Duchenne smile).",
        "Maintain an open, confident posture.",
        "Ensure lighting is flattering (frontal or 45-degree angle)."
      ]
    },
    {
      icon: Triangle,
      title: "Nose",
      meaning: "Analyzes the proportions of the nose relative to other facial features (Golden Ratio standards).",
      tips: [
        "Use lighting/makeup to balance proportions visually.",
        "Avoid wide-angle selfie lenses which distort nose size (use 50mm+ equivalent)."
      ]
    },
    {
      icon: TrendingUp,
      title: "Canthal Tilt",
      meaning: "The angle between the inner and outer corners of the eye. A positive (upward) tilt is often considered aesthetically dominant.",
      tips: [
        "Facial massages can temporarily lift the area.",
        "Hairstyles that pull back can lift features visually.",
        "Specific eyeliner techniques (for women) simulate positive tilt."
      ]
    }
  ];

  return (
    <div className="py-12">
      <h2 className="text-3xl font-bold text-center mb-10 text-slate-900 dark:text-white">
        Understanding Your Features
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className="bg-white/80 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-lg hover:shadow-sky-500/10 transition-all group"
          >
            <div className="w-12 h-12 bg-sky-100 dark:bg-sky-500/20 rounded-xl flex items-center justify-center mb-4 text-sky-600 dark:text-sky-400 group-hover:text-sky-500 dark:group-hover:text-sky-300 transition-colors">
              <feature.icon className="w-6 h-6" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed min-h-[80px]">
              {feature.meaning}
            </p>

            <div className="bg-slate-50 dark:bg-black/20 rounded-xl p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400 mb-2 uppercase tracking-wide">
                <Lightbulb className="w-3 h-3" /> Improvement Tips
              </div>
              <ul className="space-y-1.5">
                {feature.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                    <span className="mt-0.5 w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FeatureAnalysis;
