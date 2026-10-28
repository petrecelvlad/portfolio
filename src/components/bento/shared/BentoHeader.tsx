import type { HeaderSlotProps } from '@/src/components/bento/ports';

// The header slot's content (title, dates, icon) is absorbed into the clipboard rendered by
// BentoResponsibilities instead — see DR-019. Still accepts HeaderSlotProps so ProjectDetails.tsx
// can pass the same props it hands BentoResponsibilities without a special case for this slot.
export function BentoHeader(_props: HeaderSlotProps) {
  return null;
}
