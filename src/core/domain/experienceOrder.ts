// Experiences, and the projects inside each, run newest first everywhere they're listed.
export function newestFirst(a: { startDate: string }, b: { startDate: string }): number {
  return b.startDate.localeCompare(a.startDate);
}
