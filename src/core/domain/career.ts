import type { IProject } from './models';

// The career start is fixed; the career length grows on its own, a whole year every anniversary.
export const CAREER_START_DATE = '2007-01-01';

const [START_YEAR, START_MONTH, START_DAY] = CAREER_START_DATE.split('-').map(Number);

export function getCareerYears(now: Date): number {
  const hadAnniversary = now >= new Date(now.getFullYear(), START_MONTH - 1, START_DAY);
  return now.getFullYear() - START_YEAR - (hadAnniversary ? 0 : 1);
}

// Whole calendar months, both ends included, the same way a project's duration is counted.
export function getCareerMonths(now: Date): number {
  return (now.getFullYear() - START_YEAR) * 12 + (now.getMonth() + 1 - START_MONTH) + 1;
}

function toMonthIndex(isoDate: string, now: Date): number {
  if (isoDate === 'Present') return now.getFullYear() * 12 + now.getMonth();
  const [year, month] = isoDate.split('-').map(Number);
  return year * 12 + month - 1;
}

// Calendar months covered by any of the projects, both ends included; overlapping projects count once.
export function getMonthsCovered(projects: readonly Pick<IProject, 'startDate' | 'endDate'>[], now: Date): number {
  const months = new Set<number>();
  for (const { startDate, endDate } of projects) {
    const last = toMonthIndex(endDate, now);
    for (let month = toMonthIndex(startDate, now); month <= last; month++) months.add(month);
  }
  return months.size;
}

export function formatMonthsShort(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${months}m`;
  return months === 0 ? `${years}y` : `${years}y ${months}m`;
}
