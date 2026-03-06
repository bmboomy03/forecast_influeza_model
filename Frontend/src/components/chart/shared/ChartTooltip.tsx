import React from 'react';
import { ACTUAL_COLOR, FORECAST_COLOR } from './chartUtils';

interface Props {
  active?: boolean;
  payload?: any[];
  label?: string;
  settings: { decimalPrecision: number };

}

const ChartTooltip: React.FC<Props> = ({ active, payload, label, settings }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white/90 backdrop-blur-xl p-4 border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl text-sm min-w-[200px] z-50">
      <div className="mb-3 border-b border-slate-100/80 pb-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Period</p>
        <p className="text-lg font-bold text-slate-800 leading-none">{label}</p>
      </div>

      <div className="flex flex-col gap-2">
        {payload.map((entry: any, i: number) => {
          const year = parseInt(entry.name);
          const isKnownColor = isNaN(year) || [ACTUAL_COLOR, FORECAST_COLOR].includes(entry.color);
          const textColor = isKnownColor
            ? entry.color
            : `hsl(${(year * 137.508) % 360}, 75%, 40%)`;

          return (
            <div key={i} className="flex items-center justify-between gap-6 group">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-2 h-2 rounded-full ring-2 ring-white shadow-sm transition-transform group-hover:scale-125"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium text-xs text-slate-500 uppercase tracking-wide">
                  {entry.name}
                </span>
              </div>
              <span className="font-bold text-base tabular-nums" style={{ color: textColor }}>
                {settings.decimalPrecision === null
                  ? entry.value  // แสดงตามค่าจริงเลย
                  : Number(entry.value).toFixed(settings.decimalPrecision)
                }
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChartTooltip;