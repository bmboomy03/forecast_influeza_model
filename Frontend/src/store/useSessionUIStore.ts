import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type ViewMode = 'single' | 'split';

interface SessionUIStore {
    // 1. สถานะ Full-screen
    caseIsExpanded: boolean;
    rateIsExpanded: boolean;
    setCaseExpanded: (isExpanded: boolean) => void;
    setRateExpanded: (isExpanded: boolean) => void;

    // 2. สถานะโหมดกราฟ
    caseViewMode: ViewMode;
    rateViewMode: ViewMode;
    setCaseViewMode: (mode: ViewMode) => void;
    setRateViewMode: (mode: ViewMode) => void;

    rateDays: number;
    caseDays: number;
    setRateDays: (day:number) => void;
    setCaseDays: (day:number) => void;

    rateMaximizedYear: string | null;
    caseMaximizedYear: string | null; 
    setRateMaximizedYear: (year: string | null) => void;
    setCaseMaximizedYear: (year: string | null) => void;
}

export const useSessionUIStore = create<SessionUIStore>()(
    persist(
        (set) => ({
            caseIsExpanded: false,
            rateIsExpanded: false,
            setCaseExpanded: (val) => set({ caseIsExpanded: val }),
            setRateExpanded: (val) => set({ rateIsExpanded: val }),

            // ตั้งค่าเริ่มต้นให้เป็น กราฟหลัก ('single') เสมอ
            caseViewMode: 'single',
            rateViewMode: 'single',
            setCaseViewMode: (val) => set({ caseViewMode: val }),
            setRateViewMode: (val) => set({ rateViewMode: val }),

            rateDays:7,
            caseDays:7,
            setRateDays: (days) => set({ rateDays: days}),
            setCaseDays: (days) => set({ caseDays: days}),

            rateMaximizedYear: null,
            caseMaximizedYear: null,
            setRateMaximizedYear: (val) => set({ rateMaximizedYear: val}),
            setCaseMaximizedYear: (val) => set({ caseMaximizedYear: val}),
        }),
        {
            name: 'dashboard-session-ui',
            storage: createJSONStorage(() => sessionStorage), 
        }
    )
);