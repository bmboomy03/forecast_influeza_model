import React from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import type { ForecastInfoCardProps } from '../../../types';

const ForecastInfoCard: React.FC<ForecastInfoCardProps> = ({ score }) => {
  
  const getTheme = (val: number) => {
    if (val >= 80) return { text: 'text-emerald-600', bg: 'bg-emerald-500', ring: 'ring-emerald-100', bgSoft: 'bg-emerald-50' };
    if (val >= 50) return { text: 'text-amber-600', bg: 'bg-amber-500', ring: 'ring-amber-100', bgSoft: 'bg-amber-50' };
    return { text: 'text-rose-600', bg: 'bg-rose-500', ring: 'ring-rose-100', bgSoft: 'bg-rose-50' };
  };

  if (score === null) {
    return (
        <div className="mt-auto pt-4 border-t border-slate-100">
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 space-y-1">
                <AlertCircle size={18} className="opacity-50" />
                <span className="text-[10px] font-medium">No Data</span>
            </div>
        </div>
    );
  }

  const theme = getTheme(score);

  return (
    <div className="mt-auto pt-4 border-t border-slate-100">
      <div className={`relative overflow-hidden rounded-2xl border ${theme.ring} bg-white shadow-sm hover:shadow-md transition-all duration-300 group min-h-[140px] flex flex-col justify-between`}>
        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full ${theme.bg} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`}></div>
        
        <div className="relative p-5 flex flex-col h-full justify-between">
            
            {/* Header */}
            <div className="flex justify-between items-start">
                <span className="text-[12px] font-bold uppercase tracking-wider text-slate-600 mt-1">
                    Model Confidence
                </span>
                <div className={`p-1.5 rounded-lg ${theme.bgSoft}`}>
                    <Sparkles size={14} className={theme.text} />
                </div>
            </div>

            <div className="mt-6">
                <div className="flex items-end gap-1.5 translate-y-1">
                    <span className={`text-4xl font-black tracking-tighter ${theme.text} leading-none`}>
                        {score.toFixed(2)}
                    </span>
                    <div className="mb-1.5">
                        <span className={`text-xl font-bold ${theme.text} opacity-80`}>%</span>
                    </div>
                </div>
                
                <div className="flex justify-between items-end mt-2">
                    <p className="text-[10px] font-medium text-slate-400">
                       Similarity Score
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-slate-100 rounded-full mt-3 overflow-hidden">
                    <div 
                        className={`h-full rounded-full ${theme.bg}`} 
                        style={{ width: `${score}%`, transition: 'width 1s ease-out' }}
                    />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastInfoCard;