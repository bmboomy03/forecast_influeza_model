import { useQuery } from '@tanstack/react-query';

// ─── Constants ────────────────────────────────────────────────────────────────
const DAILY_LIMIT = 60;
const STALE_TIME  = 1000 * 60 * 5; // 5 นาที

// ─── Types ────────────────────────────────────────────────────────────────────
interface DailyApiItem {
  finish_date:    string;
  infection_rate: number;
  daily_cases:    number;
}

// ─── Fetch ────────────────────────────────────────────────────────────────────
const fetchDailyData = async (apiUrl: string): Promise<DailyApiItem[]> => {
  const res = await fetch(`${apiUrl}?limit=${DAILY_LIMIT}`);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useDailyData = () => {
  const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/daily-recent`;

  return useQuery({
    queryKey:  ['daily'],
    queryFn:   () => fetchDailyData(apiUrl),
    staleTime: STALE_TIME,
  });
};