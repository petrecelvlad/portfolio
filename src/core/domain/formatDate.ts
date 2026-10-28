const QUARTER_MAP = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4] as const;

export function formatDateToQuarter(isoDate: string): string {
  if (isoDate === 'Present') return 'Present';
  const [, month] = isoDate.split('-').map(Number);
  const year = isoDate.split('-')[0];
  return `Q${QUARTER_MAP[month - 1]} ${year}`;
}

// Whole calendar months, both ends included: projects end on a month's last days, so
// 2024-08-01 to 2025-01-30 is 6 months. "Present" counts to the current month.
export function formatDuration(startIsoDate: string, endIsoDate: string): string {
  const [startYear, startMonth] = startIsoDate.split('-').map(Number);
  const now = new Date();
  const [endYear, endMonth] = endIsoDate === 'Present'
    ? [now.getFullYear(), now.getMonth() + 1]
    : endIsoDate.split('-').map(Number);
  const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  return parts.join(' ');
}
