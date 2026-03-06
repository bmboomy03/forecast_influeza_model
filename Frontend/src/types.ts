export interface ChartDataPoint {
  name: string;
  [key: string]: number | string | null;
}

export interface ChartSettings {
  showGrid: boolean;
  showLabels: boolean;
  enableZoom: boolean;
  smoothTransition: boolean;
  showActiveDot: boolean;
  showFilterSection: boolean;
  decimalPrecision: number | null ;
  enableLegendHover: boolean;
}

export interface CustomLabelProps {
  x?: number;
  y?: number;
  value?: number | null;
  stroke?: string;
  precision?: number;
}

export interface YearRangeSliderProps {
  min: number;
  max: number;
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
}

export interface FilterSectionProps {
  min: number;
  max: number;
  start: number;
  end: number;
  activeCount: number;
  onChange: (start: number, end: number) => void;
}

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ChartSettings;
  onToggle: (key: keyof ChartSettings) => void;
  onSetPrecision: (val: number | null) => void;
}

export interface ChartLegendProps {
  years: string[];
  hiddenLines: Set<string>;
  onToggle: (key: string) => void;
  onToggleAll: (show: boolean) => void;
  onHover: (key: string | null) => void;
  enableHover?: boolean;
  getLineConfig?: (key:string) => {stroke:string};
  maxYear?: number;
  viewMode?: 'single' | 'split';
  forecastYears?: Set<string>;
}

export type ConfidenceData = Record<string, { rate: number; case: number }>;

export interface ChartSectionProps {
  data: ChartDataPoint[];
  activeYears: string[];
  zoomProps: {
    onMouseDown: (e: any) => void;
    onMouseMove: (e: any) => void;
    onMouseUp: (e: any) => void;
  };
  isZoomed: boolean;
  onResetZoom: () => void;
  refAreaLeft: string | null;
  refAreaRight: string | null;
  settings: ChartSettings;
  maxY?:number;
  forecastYears?: Set<string>;
  confidenceData?: ConfidenceData;
}

export type ViewMode = 'single' | 'split';

export interface LineConfig {
  stroke: string;
  strokeWidth: number;
  strokeDasharray: string;
  opacity: number;
}

export interface ForecastInfoCardProps {
  score: number | null;
}

export interface DailyData {
    date: string;
    value: number;
    ma?: number;
}

export interface LineConfig {
    stroke: string; strokeWidth: number;
    strokeDasharray: string; opacity: number;
}