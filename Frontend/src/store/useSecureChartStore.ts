import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import CryptoJS from 'crypto-js';
import type { ChartSettings } from '../types';

// 1. ตั้งรหัสผ่านลับสำหรับการเข้ารหัส
const SECRET_KEY = 'my-super-secret-hospital-key-2026!'; 

// 2. สร้าง "ยามรักษาความปลอดภัย" (Secure Adapter)
const secureStorage: StateStorage = {
    getItem: (name: string): string | null => {
        const encryptedStr = localStorage.getItem(name);
        if (!encryptedStr) return null;
        try {
            const decryptedStr = CryptoJS.AES.decrypt(encryptedStr, SECRET_KEY).toString(CryptoJS.enc.Utf8);
            return decryptedStr;
        } catch (error) {
            console.error("Failed to decrypt data", error);
            return null;
        }
    },
    setItem: (name: string, value: string): void => {
        const encryptedStr = CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
        localStorage.setItem(name, encryptedStr);
    },
    removeItem: (name: string): void => {
        localStorage.removeItem(name);
    }
};

// 3. กำหนดโครงสร้างข้อมูลที่จะจำ
interface ChartPanelSettings {
    alignAxis: boolean;
    hiddenLines: string[]; 
}

interface SecureAppStore {
    caseChart: ChartPanelSettings;
    rateChart: ChartPanelSettings;
    
    globalYearRange: {start: number | null; end: number | null};
    setGlobalYearRange: (start: number, end: number) => void;

    globalSettings: ChartSettings;
    toggleGlobalSetting: (key: keyof ChartSettings) => void;
    setGlobalPrecision: (val: number | null) => void;
    
    setCaseSetting: (key: keyof ChartPanelSettings, value: any) => void;
    setRateSetting: (key: keyof ChartPanelSettings, value: any) => void;

    toggleCaseLine: (lineKey: string) => void;
    toggleRateLine: (lineKey: string) => void;
}

// 4. สร้าง Zustand Store + สั่ง Persist + ใช้ Secure Storage
export const useSecureChartStore = create<SecureAppStore>()(
    persist(
        (set) => ({
            // --- ค่าเริ่มต้น (Default) ---
            caseChart: {alignAxis: true, hiddenLines: [] },
            rateChart: {alignAxis: true, hiddenLines: [] },

            globalYearRange: {start: null, end: null},
            
            globalSettings: {
                showGrid: true,
                showLabels: true,
                enableZoom: true,
                smoothTransition: true,
                showActiveDot: true,
                showFilterSection: true,
                decimalPrecision: 1,
                enableLegendHover: true,
            },

            // --- ฟังก์ชันเปลี่ยนค่า ---
            setGlobalYearRange: (start, end) => set({globalYearRange: {start, end}}),

            toggleGlobalSetting: (key) => set((state) => ({
                globalSettings: { ...state.globalSettings, [key]: !state.globalSettings[key] }
            })),
            
            setGlobalPrecision: (val) => set((state) => ({
                globalSettings: { ...state.globalSettings, decimalPrecision: val }
            })),

            setCaseSetting: (key, value) =>
                set((state) => ({
                    caseChart: { ...state.caseChart, [key]: value }
                })),
                
            setRateSetting: (key, value) =>
                set((state) => ({
                    rateChart: { ...state.rateChart, [key]: value }
                })),

            toggleCaseLine: (lineKey) => set((state) => {
                const currentHidden = state.caseChart.hiddenLines;
                const newHidden = currentHidden.includes(lineKey)
                    ? currentHidden.filter(key => key !== lineKey)
                    : [...currentHidden, lineKey];
                return { caseChart: { ...state.caseChart, hiddenLines: newHidden } };
            }),

            toggleRateLine: (lineKey) => set((state) => {
                const currentHidden = state.rateChart.hiddenLines;
                const newHidden = currentHidden.includes(lineKey)
                    ? currentHidden.filter(key => key !== lineKey)
                    : [...currentHidden, lineKey];
                return { rateChart: { ...state.rateChart, hiddenLines: newHidden } };
            }),
        }),
        {
            name: 'encrypted-dashboard-settings', 
            storage: createJSONStorage(() => secureStorage), 
        }
    )
);