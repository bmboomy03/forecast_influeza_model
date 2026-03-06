import React from 'react';
import { Filter } from 'lucide-react';
import type { FilterSectionProps } from '../../types';
import YearRangeSlider from './YearRangeSlider';

const FilterSection: React.FC<FilterSectionProps> = ({ min, max, start, end, activeCount, onChange }) => (
  <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 animate-in slide-in-from-top-4 duration-500">
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="flex items-center gap-3 min-w-[200px]">
        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
          <Filter size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-700">ตัวกรองช่วงปี</h3>
          <p className="text-xs text-slate-500">ลากเพื่อกำหนดช่วงปีสำหรับกราฟทั้งสอง</p>
        </div>
      </div>
      <div className="flex-1 w-full max-w-lg">
        <YearRangeSlider min={min} max={max} start={start} end={end} onChange={onChange} />
      </div>
      <div className="text-sm text-slate-500 border-l pl-6 hidden md:block">
        แสดงข้อมูล: <span className="font-bold text-slate-800">{activeCount}</span> ปี
      </div>
    </div>
  </section>
);

export default FilterSection;