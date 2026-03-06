import {
    ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Label
} from 'recharts';
import { useSessionUIStore } from '../../../store/useSessionUIStore';
import type { DailyData } from '../../../types';

interface Props {
    data: DailyData[];
}

const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const date = new Date(payload.value);
    if (isNaN(date.getTime())) return <g />;

    const dateLabel = `${date.getDate()}/${date.getMonth() + 1}`;
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={12} textAnchor="middle" fill="#1e293b" fontSize={12} fontWeight={600}>
                {dateLabel}
            </text>
            <text x={0} y={0} dy={32} textAnchor="middle" fill="#94a3b8" fontSize={12}>
                {dayName}
            </text>
        </g>
    );
};

const formatYAxis = (num: number) => {
    if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
};

const DailyWeekCase: React.FC<Props> = ({ data }) => {
    const { caseDays: days, setCaseDays } = useSessionUIStore();

    const visibleData = data.slice(-days);
    const tickHeight = days === 7 ? 60 : 80;

    return (
        <div className="bg-gradient-to-br from-white to-slate-50 p-6 rounded-2xl shadow-lg border border-slate-200/60 h-[450px] flex flex-col">
            <div className="mb-3 flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">ข้อมูลย้อนหลัง {days} วัน</h3>
                    <p className="text-xs text-slate-500 font-medium">Daily Cases</p>
                </div>

                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                    {([7, 14, 30] as const).map(d => (
                        <button
                            key={d}
                            onClick={() => setCaseDays(d)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${days === d
                                    ? 'bg-white shadow-sm text-blue-600'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {d} วัน
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={visibleData} barCategoryGap="20%" margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                        <defs>
                            <linearGradient id="caseBarGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#a7f3d0" stopOpacity={0.6} />
                            </linearGradient>

                            <linearGradient id="caseBarGradientLatest" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                <stop offset="100%" stopColor="#34d399" stopOpacity={0.8} />
                            </linearGradient>

                            <filter id="caseShadow" height="130%">
                                <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
                                <feOffset dx="0" dy="1" result="offsetblur" />
                                <feComponentTransfer>
                                    <feFuncA type="linear" slope="0.15" />
                                </feComponentTransfer>
                                <feMerge>
                                    <feMergeNode />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.6} />

                        <XAxis
                            dataKey="date"
                            tick={days === 7
                                ? <CustomXAxisTick />
                                : { fill: '#64748b', fontSize: 10 }
                            }
                            angle={days === 7 ? 0 : -45}
                            textAnchor={days === 7 ? 'middle' : 'end'}
                            tickFormatter={days === 7
                                ? undefined
                                : (val) => {
                                    const d = new Date(val);
                                    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                                }
                            }
                            height={tickHeight}
                            axisLine={false}
                            tickLine={false}
                            interval={days === 30 ? 2 : 0}
                        >
                            <Label
                                value="Daily"
                                offset={-10}
                                position="insideBottom"
                                style={{
                                    fill: '#30353f',
                                    fontSize: 13,
                                    fontWeight: 550
                                }}
                            />
                        </XAxis>

                        <YAxis
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 'auto']}
                            allowDecimals={false}
                            tickFormatter={formatYAxis}
                        >
                            <Label
                                value="Daily Cases (Persons)"
                                angle={-90}
                                position="insideLeft"
                                style={{
                                    fill: '#30353f',
                                    fontWeight: 550,
                                    fontSize: 13,
                                    textAnchor: 'middle'
                                }}
                                offset={10}
                            />
                        </YAxis>

                        <Tooltip
                            cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const dateObj = new Date(payload[0].payload.date);
                                const fullDate = dateObj.toLocaleDateString('en-US', {
                                    year: 'numeric', month: 'long',
                                    day: 'numeric', weekday: 'long',
                                });
                                return (
                                    <div className="bg-slate-900/95 backdrop-blur-sm text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700/50">
                                        <p className="font-bold mb-1.5">{fullDate}</p>
                                        <p>Cases: {Number(payload[0].value).toLocaleString()}</p>
                                        <p>MA: {Number(payload[1]?.value).toFixed(2)}</p>
                                    </div>
                                );
                            }}
                        />

                        <Bar
                            dataKey="value"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={80}
                            filter="url(#caseShadow)"
                        >
                            {visibleData.map((_, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={index === visibleData.length - 1
                                        ? 'url(#caseBarGradientLatest)'
                                        : 'url(#caseBarGradient)'
                                    }
                                />
                            ))}
                        </Bar>

                        <Line
                            type="monotone"
                            dataKey="ma"
                            stroke="#f97316"
                            strokeWidth={2.5}
                            dot={{ r: 3.5, fill: '#fff', stroke: '#f97316', strokeWidth: 2 }}
                            activeDot={{ r: 5, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
                            animationDuration={1000}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default DailyWeekCase;