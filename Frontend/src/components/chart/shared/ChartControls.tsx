import React from 'react';
import { LayoutList, LayoutGrid } from 'lucide-react';

type ViewMode = 'single' | 'split';

// ── View Mode Toggle ──────────────────────────────────────────────────────────
export const ViewModeToggle: React.FC<{
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}> = ({ value, onChange }) => (
  <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
    {([
      { mode: 'single' as ViewMode, icon: <LayoutList size={14} />, label: 'All Together' },
      { mode: 'split'  as ViewMode, icon: <LayoutGrid  size={14} />, label: 'Split' },
    ] as const).map(({ mode, icon, label }) => (
      <button
        key={mode}
        onClick={() => onChange(mode)}
        className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 text-xs font-medium ${
          value === mode
            ? 'bg-white shadow-sm text-blue-600'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        {icon} {label}
      </button>
    ))}
  </div>
);

// ── Align Axis Checkbox ───────────────────────────────────────────────────────
export const AlignAxisCheckbox: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ checked, onChange }) => (
  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none bg-slate-50 px-2 py-1.5 rounded border border-slate-200 hover:bg-slate-100">
    <input
      type="checkbox"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
    />
    Align axis scales
  </label>
);

// ── Zoom Controls ─────────────────────────────────────────────────────────────
export const ZoomControls: React.FC<{
  isZoomed: boolean;
  onReset: () => void;
}> = ({ isZoomed, onReset }) => (
  <>
    {isZoomed && (
      <button
        onClick={onReset}
        className="flex items-center gap-1 text-xs font-medium text-white bg-blue-600 px-3 py-1.5 rounded-full shadow-sm hover:bg-blue-700 transition-all"
      >
        Reset Zoom
      </button>
    )}

  </>
);