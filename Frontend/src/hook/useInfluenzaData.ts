import { useQuery } from '@tanstack/react-query';

// ─── Constants ────────────────────────────────────────────────────────────────
const WEEKS_PER_YEAR = 52;
const STALE_TIME = 1000 * 60 * 5; // 5 นาที

// ─── Types ────────────────────────────────────────────────────────────────────
interface ApiItem {
  finish_date: string;
  type: 'actual' | 'forecast';
  infection_rate: number;
  weekly_cases: number;

  confidence_rate?: string|null;
  confidence_case?: string|null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getWeekNumber = (dateStr: string): number => {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return Math.min(week, WEEKS_PER_YEAR);
};

const createWeeklyTemplate = (): Record<string, any>[] =>
  Array.from({ length: WEEKS_PER_YEAR }, (_, i) => ({ name: `W${i + 1}` }));

// ─── Fetch ────────────────────────────────────────────────────────────────────
const fetchInfluenzaData = async (apiUrl: string) => {
  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  const apiData: ApiItem[] = await res.json();

  const rateResult = createWeeklyTemplate();
  const caseResult = createWeeklyTemplate();
  const yearsSet = new Set<number>();
  
  const forecastYearsSet = new Set<string>();

  const confidenceMap: Record<string, {rate:number; case:number}> ={};

  apiData.forEach(item => {
    const idx = getWeekNumber(item.finish_date) - 1;
    const itemYear = new Date(item.finish_date).getFullYear();
    const yearKey = itemYear.toString();
    
    yearsSet.add(itemYear);


    if (item.type === 'forecast') {
      forecastYearsSet.add(yearKey);
      if(item.confidence_rate && item.confidence_case){
        confidenceMap[yearKey] = {
                rate: parseFloat(item.confidence_rate), // แปลง string เป็น number
                case: parseFloat(item.confidence_case)
            };
      }
      rateResult[idx][`${yearKey}_forecast`] = item.infection_rate;
      caseResult[idx][`${yearKey}_forecast`] = item.weekly_cases;
    } else {
      rateResult[idx][yearKey] = item.infection_rate;
      caseResult[idx][yearKey] = item.weekly_cases;
      
      rateResult[idx][`${yearKey}_actual`] = item.infection_rate;
      caseResult[idx][`${yearKey}_actual`] = item.weekly_cases;
    }
  });

  const sortedYears = Array.from(yearsSet).sort((a, b) => a - b).map(String);

  return { rateData: rateResult, caseData: caseResult, sortedYears,forecastYears:forecastYearsSet,confidenceMap, rawData: apiData };
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useInfluenzaData = () => {
  const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/dashboard`;

  return useQuery({
    queryKey: ['influenza'],
    queryFn: () => fetchInfluenzaData(apiUrl),
    staleTime: STALE_TIME,
  });
};