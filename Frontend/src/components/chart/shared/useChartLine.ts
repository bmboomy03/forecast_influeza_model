import { useState, useMemo } from 'react';
import { FORECAST_COLOR, ACTUAL_COLOR, getYearColor, getYearKeys } from './chartUtils';

type ViewMode = 'single' | 'split';

interface LineConfig {
  stroke: string;
  strokeWidth: number;
  strokeDasharray: string;
  opacity: number;
}

export const useChartLines = (
  activeYears: string[], 
  viewMode: ViewMode,
  storeHiddenLines?: string[],
  setStoreHiddenLine?: (lines: string[]) => void 
) => {
  // 1. Local State (เอาไว้สำรองเผื่อไม่ได้ต่อกับ Store)
  const [localHiddenLines, setLocalHiddenLines] = useState<Set<string>>(new Set());
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);

  // 2.อ่านค่าที่ซ่อนอยู่: ถ้ามีข้อมูลจาก Store ให้ใช้ของ Store (แปลงเป็น Set) ถ้าไม่มีใช้ Local
  const hiddenLines = useMemo(() => {
    return storeHiddenLines ? new Set(storeHiddenLines) : localHiddenLines;
  }, [storeHiddenLines, localHiddenLines]);

  const maxYear = useMemo(() => {
    const nums = activeYears.map(Number).filter(n => !isNaN(n));
    return nums.length ? Math.max(...nums) : 0;
  }, [activeYears]);

  // 3.ฟังก์ชันตัวกลางสำหรับเซฟข้อมูล
  const updateHiddenLines = (newSet: Set<string>) => {
    if (setStoreHiddenLine) {
      setStoreHiddenLine(Array.from(newSet)); // ถ้าต่อ Store อยู่ ให้แปลงเป็น Array แล้วเซฟลง LocalStorage
    } else {
      setLocalHiddenLines(newSet); // ถ้าไม่ได้ต่อ Store ก็เซฟลง State ปกติ
    }
  };

  const getLineConfig = (key: string): LineConfig => {
    if (key.includes('forecast'))
      return { stroke: FORECAST_COLOR, strokeWidth: 3, strokeDasharray: '5 5', opacity: 1 };

    const yearNum = parseInt(key);
    if (yearNum === maxYear || key.includes('actual'))
      return { stroke: ACTUAL_COLOR, strokeWidth: 4, strokeDasharray: '', opacity: 1 };

    const isHovered = hoveredLine === key;
    const isSplit = viewMode === 'split';
    return {
      stroke: getYearColor(yearNum, isSplit || isHovered),
      strokeWidth: isHovered ? 4 : 3,
      strokeDasharray: '',
      opacity: isSplit || isHovered ? 1 : 0.3,
    };
  };

  const toggleLine = (key: string) => {
    const next = new Set(hiddenLines);
    next.has(key) ? next.delete(key) : next.add(key);
    updateHiddenLines(next);
  };

  const toggleAll = (show: boolean) => {
    if (show) {
      updateHiddenLines(new Set());
    } else {
      const allKeys = activeYears.flatMap(y => getYearKeys(y, maxYear, viewMode));
      updateHiddenLines(new Set(allKeys));
    }
  };

  const isYearHidden = (year: string) =>
    getYearKeys(year, maxYear, viewMode).every(k => hiddenLines.has(k));

  return {
    maxYear, hiddenLines, hoveredLine, setHoveredLine,
    getLineConfig, toggleLine, toggleAll, isYearHidden,
  };
};