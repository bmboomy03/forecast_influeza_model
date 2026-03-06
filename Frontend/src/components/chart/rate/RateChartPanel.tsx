import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceArea,
} from 'recharts';
import ChartTooltip from '../shared/ChartTooltip';
import { getYearKeys, getKeyLabel, getDynamicMonthAxis } from '../shared/chartUtils';
import type { LineConfig } from '../../../types';

const AXIS_STYLE = {
    axisLine: { stroke: '#30353f', strokeWidth: 1.5 },
    tickLine: { stroke: '#30353f' },
};

interface Props {
    data: Record<string, any>[];
    years: string[];
    maxYear: number;
    hiddenLines: Set<string>;
    hoveredLine: string | null;
    isSplit: boolean;
    yDomain: [number | string, number | string];
    settings: any;
    getLineConfig: (key: string) => LineConfig;
    getLineStyle?: (key: string) => React.CSSProperties;
    zoomHandlers?: {
        onMouseDown: (e: any) => void;
        onMouseMove: (e: any) => void;
        onMouseUp: (e: any) => void;
    };
    refAreaLeft?: string | null;
    refAreaRight?: string | null;
    height?: number | string;
    maxY?: number;
    forceShowForecast?: boolean;
}

const RateChartPanel: React.FC<Props> = ({
    data, years, maxYear, hiddenLines, hoveredLine,
    isSplit, yDomain, settings, getLineConfig, getLineStyle,
    zoomHandlers, refAreaLeft, refAreaRight, height = 450, maxY,
    forceShowForecast = false
}) => {

    const { monthStartWeeks, weekToMonth } = getDynamicMonthAxis();

    const displayTicks = isSplit
        ? monthStartWeeks.filter((_, index) => index % 2 === 0)
        : monthStartWeeks;

    const visibleLines = years.flatMap(year =>
        getYearKeys(year, maxYear, (isSplit || forceShowForecast) ? 'split' : 'single')
            .filter(key => !hiddenLines.has(key) && data.some(row => row[key] !== undefined))
            .map(key => ({ key, config: getLineConfig(key) }))
    );

    return (
        <div style={{ height }} className="relative w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{
                        top: 20,
                        right: isSplit ? 10 : 30,
                        left: isSplit ? 0 : 10,
                        bottom: isSplit ? 20 : 50
                    }}
                    {...zoomHandlers}
                >
                    <CartesianGrid vertical={settings.showGrid} stroke="#cbd5e1" strokeOpacity={1} strokeDasharray="4 4" />

                    <XAxis
                        xAxisId="0"
                        dataKey="name"
                        interval={isSplit ? 8 : 2}
                        tickFormatter={(val) => val.replace('W', '')}
                        {...AXIS_STYLE}
                        tick={{ fill: '#64748b', fontSize: isSplit ? 10 : 12 }}
                        label={!isSplit ? {
                            value: "Week Number of Year",
                            position: "insideBottom",
                            offset: -30,
                            dy: 40, // ดันข้อความลงมาข้างล่าง 40px (ให้พ้นแกนเดือน)
                            fill: '#30353f', // สีเดียวกับ Tick
                            fontSize: 14,
                            fontWeight: 600
                        } : undefined}
                    />
                    <XAxis
                        xAxisId="1" // ตั้ง ID เป็นแกนรอง
                        dataKey="name"
                        orientation="bottom" // วางข้างล่าง
                        ticks={displayTicks}// โชว์เฉพาะจุดเริ่มเดือน
                        tickFormatter={(tick) => weekToMonth[tick]}
                        axisLine={false} // ซ่อนเส้นแกนจะได้ไม่รก
                        tickLine={false} // ซ่อนขีดสเกล
                        interval={0}
                        dy={15}
                        tick={{ fill: '#64748b', fontSize: isSplit ? 10 : 12, fontWeight: 600 }}
                    />

                    <YAxis
                        type="number"
                        domain={yDomain || [0, maxY || 'auto']}
                        allowDecimals={false}
                        tickCount={isSplit ? 4 : 6}

                        tickFormatter={(value) => value.toLocaleString()}
                        {...AXIS_STYLE}
                        width={isSplit ? 40 : 70}
                        tick={{ fill: '#64748b', fontSize: isSplit ? 10 : 12 }}
                        label={!isSplit ? {
                            value: 'Weekly Rate Infection (%)', angle: -90,
                            position: 'insideLeft', fill: '#30353f', fontSize: 14,
                            fontWeight: 550, style: { textAnchor: 'middle' },
                        } : undefined}
                    />

                    <Tooltip
                        content={<ChartTooltip settings={settings} />}

                        position={isSplit ? { y: -40 } : undefined}

                        cursor={{
                            stroke: '#94a3b8',
                            strokeWidth: 1,
                        }}

                        wrapperStyle={{ zIndex: 100 }}
                    />

                    {visibleLines.map(({ key, config }) => (
                        <Line
                            key={key}
                            xAxisId="0"
                            name={getKeyLabel(key)}
                            type="monotone"
                            dataKey={key}
                            stroke={config.stroke}
                            style={getLineStyle?.(key)}

                            strokeWidth={config.strokeWidth}
                            strokeDasharray={config.strokeDasharray}
                            strokeOpacity={config.opacity}
                            activeDot={settings.showActiveDot ? { r: 4, strokeWidth: 0 } : false}
                            dot={hoveredLine === key ? { r: 2, strokeWidth: 2, fill: config.stroke } : false}
                            isAnimationActive={false}
                        >

                        </Line>
                    ))}

                    {settings.enableZoom && refAreaLeft && refAreaRight && (
                        <ReferenceArea
                            xAxisId="0"
                            x1={refAreaLeft} x2={refAreaRight}
                            fill="#3b82f6" fillOpacity={0.1} strokeOpacity={0.3}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>

            {isSplit && (
                <div className="absolute top-0 left-12 bg-white/90 px-2 py-0.5 rounded text-sm font-bold text-slate-700 shadow-sm border border-slate-200 pointer-events-none">
                    {years[0]}
                </div>
            )}
        </div>
    );
};

export default RateChartPanel;