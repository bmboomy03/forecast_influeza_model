import {
    ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Label
} from 'recharts';
import { useSessionUIStore } from '../../../store/useSessionUIStore';
import type { DailyData } from '../../../types';

interface Props {
    data: DailyData[];
}

const CustomXAxisTick = (props: any) => {
    const { x, y, payload, } = props;
    const date = new Date(payload.value);

    if (isNaN(date.getTime())) return <g />;

    const dayDate = date.getDate();
    const month = date.getMonth() + 1;

    const dateLabel = `${dayDate}/${month}`;

    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

    return (
        <g transform={`translate(${x},${y})`}>
            {/*วันที่ (สีเข้ม) */}
            <text x={0} y={0} dy={12} textAnchor="middle" fill="#1e293b" fontSize={12} fontWeight={600}>
                {dateLabel}
            </text>
            {/*ชื่อวัน (สีอ่อน) */}
            <text x={0} y={0} dy={32} textAnchor="middle" fill="#94a3b8" fontSize={12}>
                {dayName}
            </text>
        </g>
    );
};

const DailyInfectionRate: React.FC<Props> = ({ data }) => {

    const { rateDays: days, setRateDays } = useSessionUIStore();

    const visibleData = data.slice(-days);
    const tickHeight = days === 7 ? 60 : 80;

    return (
        <div className="bg-gradient-to-br from-white to-slate-50 p-6 rounded-2xl shadow-lg border border-slate-200/60 h-[450px] flex flex-col">
            <div className="mb-3 flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">ข้อมูลย้อนหลัง {days} วัน</h3>
                    <p className="text-xs text-slate-500 font-medium">Daily Infection Rate</p>
                </div>

                {/* ปุ่มเลือกช่วงวัน */}
                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                    {([7, 14, 30] as const).map(d => (
                        <button
                            key={d}
                            onClick={() => setRateDays(d)}
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
                    <ComposedChart data={visibleData} barCategoryGap="20%" margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                        <defs>
                            {/* Gradient สำหรับแท่งก่อนหน้า */}
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#bfdbfe" stopOpacity={0.6} />
                            </linearGradient>

                            {/* Gradient สำหรับแท่งวันล่าสุด */}
                            <linearGradient id="barGradientLatest" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.8} />
                            </linearGradient>

                            {/* Shadow effect */}
                            <filter id="shadow" height="130%">
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
                                offset={-15}
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
                            domain={['auto', 'auto']}
                            tickFormatter={(val) => val.toFixed(2)}
                        >
                            <Label
                                value="Infection Rate (%)"
                                angle={-90}
                                position="insideLeft"
                                style={{
                                    fill: '#30353f',
                                    fontWeight: 550,
                                    fontSize: 13,
                                    textAnchor: 'middle'
                                }}
                            />
                        </YAxis>

                        <Tooltip
                            cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const dateStr = payload[0].payload.date;
                                    const dateObj = new Date(dateStr);
                                    const fullDate = dateObj.toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        weekday: 'long'
                                    });

                                    return (
                                        <div className="bg-slate-900/95 backdrop-blur-sm text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700/50">
                                            <p className="font-bold mb-1.5">{fullDate}</p>
                                            <p>Rate: {Number(payload[0].value).toFixed(2)}</p>
                                            <p>MA: {Number(payload[1]?.value).toFixed(2)}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />

                        <Bar
                            dataKey="value"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={80}
                            filter="url(#shadow)"
                        >
                            {visibleData.map((_, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={index === data.length - 1 ? 'url(#barGradientLatest)' : 'url(#barGradient)'}
                                />
                            ))}
                        </Bar>
                        <Line
                            type="monotone"
                            dataKey="ma"
                            stroke="#f97316"
                            strokeWidth={2.5}
                            dot={{ r: 3.5, fill: '#fff', stroke: '#f97316', strokeWidth: 2 }} // จุดเล็กๆ
                            activeDot={{ r: 5, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
                            animationDuration={1000}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default DailyInfectionRate;