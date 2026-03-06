import React from 'react';
import type { ChartLegendProps } from '../../../types';

const ChartLegend: React.FC<ChartLegendProps> = ({ 
  years, 
  hiddenLines, 
  onToggle, 
  onToggleAll, 
  onHover, 
  enableHover = true,
  getLineConfig,
  maxYear,
  viewMode, 
  forecastYears,
}) => {

  const getColor = (key: string) => {
    if (getLineConfig) return getLineConfig(key).stroke;
    return '#94a3b8'; 
  };

  const safeMaxYear = maxYear || Math.max(...years.map(y => parseInt(y)).filter(n => !isNaN(n)));

  return (
    <div className="w-48 flex flex-col pl-4 border-l border-slate-200">
      
      {/* ปุ่ม Show/Hide All */}
      <div className="flex gap-2 pb-2 mb-2 border-b border-slate-200 shrink-0">
        <button 
            onClick={() => onToggleAll(true)} 
            className="flex-1 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
        >
            Show All
        </button>
        <button 
            onClick={() => onToggleAll(false)} 
            className="flex-1 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
        >
            Hide All
        </button>
      </div>

      <div className="overflow-y-auto pr-2 flex-1 space-y-2">
        {years.map((year: string) => {
          const yearNum = parseInt(year);

          const hasForecastData = forecastYears?.has(year);

          const showGroup = (viewMode === 'split' || yearNum === safeMaxYear) && hasForecastData;

          const renderItem = (key: string, label: string) => {
             const color = getColor(key);
             const isForecast = key.includes('forecast');
             
             return (
                <div key={key} className="flex items-center gap-2 group">
                  <input 
                    type="checkbox" 
                    checked={!hiddenLines.has(key)} 
                    onChange={() => onToggle(key)} 
                    className="w-4 h-4 accent-slate-500 cursor-pointer" 
                  />
                  
                  <div
                    className={`flex items-center gap-2 transition-opacity duration-300 
                        ${enableHover ? 'cursor-pointer hover:opacity-100 opacity-80' : 'cursor-default opacity-100'}
                    `}
                    onMouseEnter={() => enableHover && onHover && onHover(key)}
                    onMouseLeave={() => enableHover && onHover && onHover(null)}
                  >
                    <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ 
                            backgroundColor: isForecast ? 'transparent' : color, 
                            border: `2px solid ${color}` 
                        }} 
                    />
                    <span className="text-sm text-slate-700 font-medium">{label}</span>
                  </div>
                </div>
             );
          };

          //2. ปรับเงื่อนไข: ถ้าเป็นปีล่าสุด หรือ อยู่ในโหมด Split ให้โชว์ทั้ง Actual และ Forecast
          if (showGroup) {
            return (
              <div key={`${year}-group`} className="flex flex-col gap-2">
                {/*ถ้ามี Forecast: บรรทัดแรกใส่คำว่า Actual */}
                {renderItem(
                    yearNum === safeMaxYear ? `${year}_actual` : year, // Key
                    `${year} Actual` // Label
                )}
                {/*บรรทัดสอง: ใส่ชื่อปี + Forecast */}
                {renderItem(`${year}_forecast`, `${year} Forecast`)}
              </div>
            );
          }
          
          if (yearNum === safeMaxYear) {
            return renderItem(`${year}_actual`, year);
          }

          return renderItem(year, year);
        })}
      </div>
    </div>
  );
};

export default ChartLegend;