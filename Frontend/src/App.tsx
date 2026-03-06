import React, { useState, useMemo } from 'react';
import Header from './components/ui/Header';
import SettingsModal from './components/ui/SettingsModal';
import FilterSection from './components/ui/FilterSection';
import RateChartSection from './components/chart/rate/RateChartSection';
import CaseChartSection from './components/chart/case/CaseChartSection';
import DailyRecentChart from './components/chart/rate/DailyInfectionRate';
import { useChartZoom } from './hook/useChartZoom';
import { useInfluenzaData } from './hook/useInfluenzaData';
import DailyCaseChart from './components/chart/case/DailyWeekCase';
import { useDailyData } from './hook/useDailyData';
import { useSecureChartStore } from './store/useSecureChartStore';
import { useSessionUIStore } from './store/useSessionUIStore';

const App: React.FC = () => {
  const { data, isLoading, isError } = useInfluenzaData();
  const forecastYears = data?.forecastYears ?? new Set();

  const sortedYears = data?.sortedYears ?? [];
  const rateData = data?.rateData ?? [];
  const caseData = data?.caseData ?? [];
  const rawData = data?.rawData ?? [];
  const { data: dailyRaw } = useDailyData();
  const minYear = sortedYears.length ? parseInt(sortedYears[0]) : 2020;
  const maxYear = sortedYears.length ? parseInt(sortedYears[sortedYears.length - 1]) : 2030;
  const confidenceData = data?.confidenceMap || {};
  const { globalYearRange, setGlobalYearRange } = useSecureChartStore();

  const rangeStart = globalYearRange.start ?? Math.max(minYear, maxYear - 4);
  const rangeEnd = globalYearRange.end ?? maxYear;
  const { rateDays } = useSessionUIStore(); 
  const { caseDays } = useSessionUIStore();
  // ── Settings ──────────────────────────────────────────────────────────────
  const {
    globalSettings,
    toggleGlobalSetting,
    setGlobalPrecision
  } = useSecureChartStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const recentDailyData = useMemo(() => {
  if (!dailyRaw?.length) return [];

  const windowSize = rateDays; 

  return dailyRaw.map((item: any, index: number, arr: any[]) => {
    const start = Math.max(0, index - windowSize + 1);
    const end = index + 1;
    const window = arr.slice(start, end);
    const avg = window.reduce((acc: number, curr: any) => 
      acc + curr.infection_rate, 0) / window.length;

    return {
      date: item.finish_date,
      value: item.infection_rate,
      ma: avg,
    };
  });
}, [dailyRaw, rateDays]); 

  const recentDailyCaseData = useMemo(() => {
  if (!dailyRaw?.length) return [];

  const windowSize = caseDays; // ← หรือใช้ rateDays ถ้าใช้ร่วมกัน

  return dailyRaw.map((item: any, index: number, arr: any[]) => {
    const start = Math.max(0, index - windowSize + 1);
    const end = index + 1;
    const window = arr.slice(start, end);
    const avg = window.reduce((acc: number, curr: any) => 
      acc + curr.daily_cases, 0) / window.length;

    return {
      date: item.finish_date,
      value: item.daily_cases,
      ma: avg,
    };
  });
}, [dailyRaw, caseDays]); // ← เพิ่ม dependency

  const globalMaxRate = useMemo(() => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) return 10;

    const validValues = rawData
      .map((d: any) => Number(d.infection_rate))
      .filter((val) => Number.isFinite(val));

    if (validValues.length === 0) return 10;

    const maxVal = Math.max(...validValues);

    //ฟังก์ชันปัดเศษแบบฉลาด (Adaptive Rounding) แกน Y
    const getNiceMax = (val: number) => {
      if (val <= 10) return 10;         
      if (val <= 50) return Math.ceil(val / 5) * 5;
      if (val <= 100) return Math.ceil(val / 10) * 10; 
      if (val <= 500) return Math.ceil(val / 50) * 50; 

      const magnitude = Math.pow(10, Math.floor(Math.log10(val)));
      return Math.ceil(val / (magnitude / 2)) * (magnitude / 2);
    };

    return getNiceMax(maxVal);
  }, [rawData]);

  // ── Active Years ──────────────────────────────────────────────────────────
  const activeYears = useMemo(() =>
    sortedYears.filter(y => {
      const yn = parseInt(y);
      return yn >= rangeStart && yn <= rangeEnd;
    }),
    [rangeStart, rangeEnd, sortedYears]
  );

  // ── Zoom ──────────────────────────────────────────────────────────────────
  const rateZoom = useChartZoom(rateData);
  const caseZoom = useChartZoom(caseData);

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-slate-700 font-semibold text-lg">กำลังโหลดข้อมูล</p>
      </div>
    </div>
  );

  if (isError) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <div className="bg-white border border-red-100 shadow-lg rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm w-full mx-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-slate-800 font-semibold text-lg">โหลดข้อมูลไม่สำเร็จ</p>
          <p className="text-slate-400 text-sm mt-1">ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={globalSettings}
        onToggle={toggleGlobalSetting}
        onSetPrecision={setGlobalPrecision}
      />

      <main className="max-w-7xl mx-auto space-y-8">

        {globalSettings.showFilterSection && (
          <FilterSection
            min={minYear}
            max={maxYear}
            start={rangeStart}
            end={rangeEnd}
            activeCount={activeYears.length}
            onChange={(s, e) => setGlobalYearRange(s, e)}
          />
        )}


        <RateChartSection
          data={rateZoom.visibleData}
          activeYears={activeYears}
          maxY={globalMaxRate}
          zoomProps={rateZoom.zoomProps}
          isZoomed={rateZoom.isZoomed}
          onResetZoom={rateZoom.resetZoom}
          refAreaLeft={rateZoom.refAreaLeft}
          refAreaRight={rateZoom.refAreaRight}
          settings={globalSettings}
          forecastYears={forecastYears}
          confidenceData={confidenceData}
        />

        <CaseChartSection
          data={caseZoom.visibleData}
          activeYears={activeYears}
          zoomProps={caseZoom.zoomProps}
          isZoomed={caseZoom.isZoomed}
          onResetZoom={caseZoom.resetZoom}
          refAreaLeft={caseZoom.refAreaLeft}
          refAreaRight={caseZoom.refAreaRight}
          settings={globalSettings}
          forecastYears={forecastYears}
          confidenceData={confidenceData}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DailyRecentChart data={recentDailyData} />
          <DailyCaseChart data={recentDailyCaseData} />
        </div>
      </main>
    </div>
  );
};

export default App;