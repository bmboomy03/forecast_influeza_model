const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const getDynamicMonthAxis = () => {
  // ใช้ปีปัจจุบันเป็นเกณฑ์ เพื่อหาว่าสัปดาห์ไหนตกเดือนไหน
  const refYear = new Date().getFullYear(); 
  const monthStartWeeks: string[] = [];
  const weekToMonth: Record<string, string> = {};
  let currentMonth = -1;

  for (let w = 1; w <= 52; w++) {
    // ตามมาตรฐาน ISO 8601: สัปดาห์ที่ 1 คือสัปดาห์ที่มีวันที่ 4 ม.ค.
    const d = new Date(Date.UTC(refYear, 0, 4));
    d.setUTCDate(d.getUTCDate() + (w - 1) * 7);
    const month = d.getUTCMonth(); // จะได้เลขเดือน 0-11

    // ถ้าตรวจพบว่าเข้าสู่เดือนใหม่ ให้จดชื่อสัปดาห์นั้นไว้เป็นจุดแสดงผลแกน X
    if (month !== currentMonth) {
      monthStartWeeks.push(`W${w}`); // เช่น W1, W5, W9, W14... (ยืดหยุ่นตามปฏิทินจริง)
      weekToMonth[`W${w}`] = MONTH_LABELS[month]; // จับคู่ W5 = Feb
      currentMonth = month;
    }
  }
  return { monthStartWeeks, weekToMonth };
};

export const FORECAST_COLOR = '#7c3aed';
export const ACTUAL_COLOR   = '#dc2626';

export const getYearColor = (year: number, active: boolean) => {
  const hue = (year * 137.508) % 360;
  return active
    ? `hsl(${hue}, 78%, 45%)`
    : `hsl(${hue}, 60%, 78%)`;
};

export const getYearKeys = (year: string, maxYear: number, viewMode: 'single' | 'split' = 'single'): string[] => {
  const yearNum = parseInt(year);

  if (yearNum === maxYear) {
    return [`${year}_actual`, `${year}_forecast`];
  }

  // 2. ถ้าเป็นโหมด Split -> แสดงคู่ทุกปี (เพื่อให้เห็น Forecast ของปีนั้นๆ)
  if (viewMode === 'split') {
    // ใช้ key ปกติคู่กับ forecast
    return [year, `${year}_forecast`]; 
  }

  // 3. ถ้าเป็นโหมด Single ปีเก่าๆ -> แสดงเส้นเดียว
  return [year];
}

export const getKeyLabel = (key: string): string =>
  key.includes('forecast') ? 'Forecast' : key.replace('_actual', '');

export const computeGlobalMaxY = (
  data: Record<string, any>[],
  activeYears: string[],
  maxYear: number,
): number | 'auto' => {
  let max = 0;
  data.forEach(row =>
    activeYears.forEach(year =>
      getYearKeys(year, maxYear).forEach(key => {
        const v = Number(row[key]);
        if (!isNaN(v) && v > max) max = v;
      })
    )
  );
  return max > 0 ? max * 1.1 : 'auto';
};