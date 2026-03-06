import React, { useMemo } from 'react';
import { Maximize, Minimize, Maximize2, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import CaseChartPanel from './CaseChartPanel';
import ChartLegend from '../shared/ChartLegend';
import { ViewModeToggle, AlignAxisCheckbox, ZoomControls } from '../shared/ChartControls';
import { useChartLines } from '../shared/useChartLine';
import { computeGlobalMaxY } from '../shared/chartUtils';
import { useLineStyle } from '../../../utils';
import type { ChartSectionProps } from '../../../types';
import { useSecureChartStore } from '../../../store/useSecureChartStore';
import { useSessionUIStore } from '../../../store/useSessionUIStore';
import ForecastInfoCard from '../shared/ForecastInfoCard';
import { getYearKeys } from '../shared/chartUtils';

const CaseChartSection: React.FC<ChartSectionProps> = ({
    data, activeYears, zoomProps, isZoomed, onResetZoom,
    refAreaLeft, refAreaRight, settings, forecastYears, confidenceData = {}
}) => {

    const {
        caseViewMode, setCaseViewMode,
        caseIsExpanded, setCaseExpanded, 
        caseMaximizedYear, setCaseMaximizedYear
    } = useSessionUIStore();

    const { caseChart, setCaseSetting } = useSecureChartStore();
    const alignAxis = caseChart.alignAxis;

    React.useEffect(() => {
        document.body.style.overflow = caseIsExpanded ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [caseIsExpanded]);

    const {
        maxYear, hiddenLines, hoveredLine, setHoveredLine,
        getLineConfig, toggleLine, toggleAll,
    } = useChartLines(activeYears, caseViewMode, caseChart.hiddenLines,
        (newLines) => setCaseSetting('hiddenLines', newLines)
    );

    const getLineStyle = useLineStyle(hoveredLine, settings.smoothTransition);

    const processedData = data;

    const globalMaxY = useMemo(
        () => computeGlobalMaxY(processedData, activeYears, maxYear),
        [processedData, activeYears, maxYear],
    );

    const isSplit = caseViewMode === 'split';
    const yDomain: [number | string, number | string] = React.useMemo(() => {
        if (isSplit) return alignAxis ? [0, globalMaxY] : [0, 'auto'];
        return [0, globalMaxY];
    }, [isSplit, alignAxis, globalMaxY]);

    const latestScoreInfo = useMemo(() => {
        if (caseMaximizedYear) {
            const score = confidenceData[caseMaximizedYear]?.case ?? null;
            return { score, year: caseMaximizedYear };
        }
        const sortedValidYears = activeYears
            .filter(y => forecastYears?.has(y) && confidenceData[y])
            .sort((a, b) => Number(b) - Number(a));

        const latestYear = sortedValidYears[0];

        if (latestYear) {
            return {
                score: confidenceData[latestYear].case,
                year: latestYear
            };
        }
        return { score: null, year: null };
    }, [caseMaximizedYear, activeYears, forecastYears, confidenceData]);

    const shouldShowYear = (year: string) => {
        const yearKeys = getYearKeys(year, maxYear, 'split');
        
        return yearKeys.some(key => {
            if (hiddenLines.has(key)) return false;
            const hasData = data.some(row => row[key] !== undefined && row[key] !== null);
            
            return hasData;
        });
    };

    const chartContent = (
        <section className={`bg-white border border-slate-200 transition-all duration-300 ${caseIsExpanded
            ? 'fixed inset-0 z-50 p-6 rounded-none h-screen bg-slate-50'
            : 'relative p-6 rounded-2xl shadow-sm hover:shadow-md mb-8'
            }`}>

            {/* Header */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold">Volume Analysis: Actual Cases & Weekly Estimates</h2>
                    <p className="text-sm text-slate-500">กราฟแสดงจำนวนผู้ป่วยสะสมรายสัปดาห์ (Actual) เทียบกับค่าประมาณการจำนวนผู้ป่วยล่วงหน้า (Forecasting) ล่วงหน้า 4 สัปดาห์
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <ViewModeToggle value={caseViewMode} onChange={(mode) => { setCaseViewMode(mode); setCaseMaximizedYear(null); }} />

                    {isSplit && !caseMaximizedYear && (
                        <AlignAxisCheckbox
                            checked={alignAxis}
                            onChange={(checked) => setCaseSetting('alignAxis', checked)}
                        />
                    )}

                    <button
                        onClick={() => setCaseExpanded(!caseIsExpanded)}
                        className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                    >
                        {caseIsExpanded
                            ? <><Minimize size={14} /> Exit Fullscreen</>
                            : <><Maximize size={14} /> Fullscreen</>
                        }
                    </button>
                    <ZoomControls isZoomed={isZoomed} onReset={onResetZoom} />
                </div>
            </div>

            {/* Main Content Wrapper */}
            <div className={`flex gap-4 p-1 border border-slate-200/60 rounded-xl bg-white min-w-[300px] overflow-hidden ${caseIsExpanded ? 'h-[calc(100%-80px)]' : 'h-[600px]'}`}>

                {/* Left Side: Chart Area */}
                <div className={`flex-1 min-w-0 relative overflow-y-auto custom-scrollbar p-2 ${settings.enableZoom && !isSplit ? 'select-none cursor-crosshair' : ''}`}>

                    {/* 1. Maximized View */}
                    {caseMaximizedYear ? (
                        <div className="absolute inset-0 z-50 bg-white flex flex-col rounded-lg">
                            <div className="flex justify-between items-center p-3 border-b border-slate-100 bg-slate-50/50 rounded-t-lg shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm">
                                        Year: {caseMaximizedYear}
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium">Focused View</span>
                                </div>
                                <button
                                    onClick={() => setCaseMaximizedYear(null)}
                                    className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg border border-slate-200 transition-all shadow-sm"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex-1 w-full min-h-0 p-4">
                                <CaseChartPanel
                                    data={processedData}
                                    years={[caseMaximizedYear]}
                                    maxYear={maxYear}
                                    hiddenLines={hiddenLines}
                                    hoveredLine={hoveredLine}
                                    isSplit={false}
                                    yDomain={yDomain}
                                    settings={settings}
                                    getLineConfig={getLineConfig}
                                    getLineStyle={getLineStyle}
                                    height="100%"
                                    forceShowForecast={true}
                                />
                            </div>
                        </div>

                    /* 2. Split View */
                    ) : isSplit ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                            {activeYears.filter(year => shouldShowYear(year)).map(year => (
                                <div key={year} className="relative group border border-slate-200 rounded-xl p-3 bg-slate-50/30 hover:border-slate-300 hover:shadow-sm transition-all h-[320px]">
                                    <button
                                        onClick={() => setCaseMaximizedYear(year)}
                                        className="absolute top-3 right-3 z-10 p-1.5 bg-white text-slate-400 hover:text-blue-600 rounded-lg shadow-sm border border-slate-200 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-105"
                                        title={`Maximize ${year}`}
                                    >
                                        <Maximize2 size={16} />
                                    </button>

                                    <CaseChartPanel
                                        data={processedData} years={[year]} maxYear={maxYear}
                                        hiddenLines={hiddenLines} hoveredLine={hoveredLine}
                                        isSplit={true} yDomain={yDomain}
                                        settings={settings} getLineConfig={getLineConfig}
                                        getLineStyle={getLineStyle}
                                        height="100%"
                                    />
                                </div>
                            ))}
                        </div>

                    /* 3. Single View */
                    ) : (
                        <div className="h-full w-full p-2">
                            <CaseChartPanel
                                data={processedData} years={activeYears} maxYear={maxYear}
                                hiddenLines={hiddenLines} hoveredLine={hoveredLine}
                                isSplit={false} yDomain={yDomain}
                                settings={settings} getLineConfig={getLineConfig}
                                getLineStyle={getLineStyle}
                                zoomHandlers={settings.enableZoom ? zoomProps : undefined}
                                refAreaLeft={refAreaLeft} refAreaRight={refAreaRight}
                                height="100%"
                            />
                        </div>
                    )}
                </div>

                {/* Right Side: Legend & Info */}
                <div className="hidden md:flex flex-col w-60 shrink-0 h-full max-h-full border-l border-slate-100 pl-4 py-2">
                    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pr-2 custom-scrollbar">
                        <ChartLegend
                            years={caseMaximizedYear ? [caseMaximizedYear] : activeYears}
                            hiddenLines={hiddenLines}
                            onToggle={toggleLine}
                            onToggleAll={toggleAll}
                            onHover={setHoveredLine}
                            getLineConfig={getLineConfig}
                            maxYear={maxYear}
                            enableHover={!isSplit || !!caseMaximizedYear}
                            viewMode={caseMaximizedYear ? 'split' : caseViewMode}
                            forecastYears={forecastYears}
                        />
                    </div>
                    <div className="shrink-0 mt-4 z-10">
                        <ForecastInfoCard
                            score={latestScoreInfo.score}
                        />
                    </div>
                </div>
            </div>
        </section>
    );

    return caseIsExpanded
        ? createPortal(chartContent, document.body)
        : chartContent;
};

export default CaseChartSection;