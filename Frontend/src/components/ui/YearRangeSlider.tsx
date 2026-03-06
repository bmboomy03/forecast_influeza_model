import React from 'react';
import type { YearRangeSliderProps } from '../../types';

const YearRangeSlider: React.FC<YearRangeSliderProps> = ({ min, max, start, end, onChange }) => (
  <div className="flex flex-col w-full px-2">
    <div className="flex justify-between text-sm text-slate-500 mb-2 font-medium">
      <span>{start}</span>
      <span className="text-slate-400 text-xs">ช่วงปีที่แสดงผล</span>
      <span>{end}</span>
    </div>
    <div className="relative h-2 bg-slate-200 rounded-full">
      <div
        className="absolute h-full bg-blue-500 rounded-full opacity-50"
        style={{
          left: `${((start - min) / (max - min)) * 100}%`,
          right: `${100 - ((end - min) / (max - min)) * 100}%`
        }}
      />
      <input
        type="range" min={min} max={max} value={start}
        onChange={(e) => onChange(Math.min(Number(e.target.value), end - 1), end)}
        className="absolute w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer z-10"
      />
      <input
        type="range" min={min} max={max} value={end}
        onChange={(e) => onChange(start, Math.max(Number(e.target.value), start + 1))}
        className="absolute w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer z-20"
      />
    </div>
  </div>
);

export default YearRangeSlider;