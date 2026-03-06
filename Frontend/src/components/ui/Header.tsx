import React from 'react';
import {Settings } from 'lucide-react';

const Header: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => (
  <header className="max-w-7xl mx-auto mb-8 flex justify-between items-start">
    <div>
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">
          Influenza Epidemic Forecasting System (IEFS)
        </h1>
      </div>
      <p className="text-slate-500 flex items-center gap-2">
       &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ระบบพยากรณ์แนวโน้มการระบาดของโรคไข้หวัดใหญ่สำหรับโรงพยาบาลกรุงเทพภูเก็ต 
       โดยใช้ข้อมูลย้อนหลังและแบบจำลอง Machine Learning เพื่อสนับสนุนการวางแผนและการบริหารจัดการทรัพยากรทางการแพทย์อย่างมีประสิทธิภาพ
      </p>
    </div>
    <button
      onClick={onOpenSettings}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group active:scale-95"
    >
      <Settings size={18} className="group-hover:rotate-45 transition-transform duration-500" />
      <span className="font-medium">Settings</span>
    </button>
  </header>
);

export default Header;