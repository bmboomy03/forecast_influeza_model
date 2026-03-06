import React from 'react';
import { X, Check, Grid3X3, MousePointer, Tag, SlidersHorizontal } from 'lucide-react';
import type { SettingsModalProps } from '../../types';

// ─── Section Component ────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title, icon, children,
}) => (
  <div className="mb-1">
    <div className="flex items-center gap-2 px-5 py-3">
      <span className="text-slate-400">{icon}</span>
      <span className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">{title}</span>
    </div>
    <div className="px-3">{children}</div>
  </div>
);

// ─── Toggle Row Component ─────────────────────────────────────────────────────
const ToggleRow: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
}> = ({ label, description, checked, onChange }) => (
  <button
    onClick={onChange}
    className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-50 transition-all duration-150 group text-left"
  >
    <div>
      <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
        {label}
      </p>
      {description && (
        <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
      )}
    </div>

    {/* Toggle Switch */}
    <div className={`relative flex-shrink-0 w-9 h-5 rounded-full transition-all duration-200 ${
      checked ? 'bg-blue-600' : 'bg-slate-200'
    }`}>
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${
        checked ? 'left-[18px]' : 'left-0.5'
      }`} />
    </div>
  </button>
);

// ─── Main Modal ───────────────────────────────────────────────────────────────
const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, settings, onToggle, onSetPrecision,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-[380px] overflow-hidden"
        style={{ boxShadow: '0 25px 60px -10px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center">
              <SlidersHorizontal size={13} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-800">Chart Settings</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="py-2 max-h-[65vh] overflow-y-auto">

          {/* View */}
          <Section title="View" icon={<Grid3X3 size={13} />}>
            <ToggleRow
              label="Filter Section"
              description="แสดง/ซ่อนแถบกรองข้อมูลด้านบน"
              checked={settings.showFilterSection}
              onChange={() => onToggle('showFilterSection')}
            />
            <ToggleRow
              label="Grid Lines"
              description="เส้นตารางบนกราฟ"
              checked={settings.showGrid}
              onChange={() => onToggle('showGrid')}
            />
            <ToggleRow
              label="Show Labels"
              description="แสดงค่าบนเส้นเมื่อ hover"
              checked={settings.showLabels}
              onChange={() => onToggle('showLabels')}
            />
          </Section>

          {/* Interactivity */}
          <Section title="Interactivity" icon={<MousePointer size={13} />}>
            <ToggleRow
              label="Enable Zoom"
              description="ลากเพื่อซูมดูช่วงเวลาที่ต้องการ"
              checked={settings.enableZoom}
              onChange={() => onToggle('enableZoom')}
            />
            <ToggleRow
              label="Hover Focus"
              description="Highlight เส้นเมื่อ hover ที่ legend"
              checked={settings.enableLegendHover}
              onChange={() => onToggle('enableLegendHover')}
            />
          </Section>

          <div className="mx-5 border-t border-slate-100" />

          {/* Decimal Precision */}
          <Section title="Decimal Precision" icon={<Tag size={13} />}>
            <div className="px-3 pb-3">
              {/* Segmented Control */}
              <div className="bg-slate-100 p-1 rounded-xl flex gap-1 mb-2">
                {[0, 1, 2, 3].map(num => {
                  const isActive = settings.decimalPrecision === num;
                  return (
                    <button
                      key={num}
                      onClick={() => onSetPrecision(num)}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1 transition-all duration-150 ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <span className="font-mono">
                        {num === 0 ? '1' : `1.${'0'.repeat(num)}`}
                      </span>
                      {isActive && <Check size={9} className="text-blue-600" />}
                    </button>
                  );
                })}
              </div>

              {/* Auto button */}
              <button
                onClick={() => onSetPrecision(null)}
                className={`w-full py-1.5 text-xs rounded-lg border transition-all duration-150 ${
                  settings.decimalPrecision === null
                    ? 'border-blue-200 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                }`}
              >
                {settings.decimalPrecision === null && <Check size={9} className="inline mr-1" />}
                Auto
              </button>
            </div>
          </Section>

        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] text-slate-400">Influenza Forecast Dashboard</p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;