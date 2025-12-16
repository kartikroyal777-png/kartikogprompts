import React, { useState, useRef } from 'react';
import { Download, Flame, Sparkles, CheckCircle, Loader2 } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { RateMeParameters } from '../../types';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

interface ResultCardProps {
  image: string;
  data: RateMeParameters;
  finalScore: number;
  onPublish?: () => void;
  isPublishing?: boolean;
}

const ResultCard: React.FC<ResultCardProps> = ({ image, data, finalScore, onPublish, isPublishing }) => {
  const [showRoast, setShowRoast] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const chartData = [
    { subject: 'Symmetry', A: data.symmetry || data.face, fullMark: 100 },
    { subject: 'Jawline', A: data.jawline, fullMark: 100 },
    { subject: 'Cheekbones', A: data.cheekbones || data.face, fullMark: 100 },
    { subject: 'Canthal Tilt', A: data.canthal_tilt || data.eyes, fullMark: 100 },
    { subject: 'Nose', A: data.nose || data.face, fullMark: 100 },
    { subject: 'Skin', A: data.skin, fullMark: 100 },
    { subject: 'Eyes', A: data.eyes, fullMark: 100 },
    { subject: 'Outfit', A: data.outfit, fullMark: 100 },
    { subject: 'Aura', A: data.overall, fullMark: 100 },
  ];

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    
    // Wait for state update to remove gradient text classes if needed
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: '#0f172a', // Force dark background for the card
        scale: 2, // Higher quality
        logging: false,
        onclone: (clonedDoc) => {
            // Fix for bg-clip-text issues in html2canvas
            // Find elements with gradient text and make them solid color for the screenshot
            const gradientTexts = clonedDoc.querySelectorAll('.text-gradient-capture');
            gradientTexts.forEach((el: any) => {
                el.style.backgroundImage = 'none';
                el.style.webkitTextFillColor = 'initial';
                el.style.color = '#38bdf8'; // Sky blue fallback
            });
        }
      });
      
      const link = document.createElement('a');
      link.download = `og-rate-me-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success("Card saved to gallery!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save image.");
    } finally {
      setDownloading(false);
    }
  };

  const MetricBar = ({ label, value }: { label: string, value: number }) => (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 text-slate-400 font-medium truncate">{label}</span>
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full" 
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 text-right text-white font-mono">{value}</span>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Capture Area */}
      <div 
        ref={cardRef}
        className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative"
      >
        {/* Header / Image */}
        <div className="relative h-96">
          <img src={image} alt="Analysis" className="w-full h-full object-cover" crossOrigin="anonymous" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
          
          {/* Score Badge */}
          <div className="absolute bottom-4 right-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-center shadow-lg">
              <div className="text-xs text-slate-300 uppercase tracking-wider font-bold mb-1">OG Score</div>
              <div className="text-gradient-capture text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-purple-500">
                {finalScore.toFixed(3)}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Radar Chart */}
          <div className="h-64 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Score"
                  dataKey="A"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  fill="#0ea5e9"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Stats Grid */}
          <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-800">
             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 text-center">Detailed Metrics</h4>
             <div className="grid grid-cols-1 gap-2">
               <MetricBar label="Symmetry" value={data.symmetry || data.face} />
               <MetricBar label="Jawline" value={data.jawline} />
               <MetricBar label="Cheekbones" value={data.cheekbones || data.face} />
               <MetricBar label="Canthal Tilt" value={data.canthal_tilt || data.eyes} />
               <MetricBar label="Nose" value={data.nose || data.face} />
               <MetricBar label="Skin Quality" value={data.skin} />
               <MetricBar label="Outfit" value={data.outfit} />
               <MetricBar label="Overall Aura" value={data.overall} />
             </div>
          </div>

          {/* Roast / Toast Toggle */}
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
            <div className="flex justify-center gap-4 mb-3">
              <button
                onClick={() => setShowRoast(false)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                  !showRoast ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-slate-500'
                }`}
              >
                <Sparkles className="w-3 h-3" /> Toast
              </button>
              <button
                onClick={() => setShowRoast(true)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                  showRoast ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-500'
                }`}
              >
                <Flame className="w-3 h-3" /> Roast
              </button>
            </div>
            <p className="text-center text-slate-300 font-medium italic min-h-[3rem] flex items-center justify-center">
              "{showRoast ? (data.roast || "You look too good to roast!") : (data.toast || "Looking sharp!")}"
            </p>
          </div>
          
          {/* Branding Footer for Screenshot - Updated */}
          <div className="text-center pt-2 pb-1">
            <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">OG Prompts • Aesthetic AI</p>
          </div>
        </div>
      </div>

      {/* Actions (Outside Capture Area) */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <button 
          onClick={handleDownload}
          disabled={downloading}
          className="py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Save Card
        </button>
        {onPublish && (
          <button 
            onClick={onPublish}
            disabled={isPublishing}
            className="py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
          >
            {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Publish
          </button>
        )}
      </div>
    </div>
  );
};

export default ResultCard;
