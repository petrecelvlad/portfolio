export interface CopySegment {
  text: string;
  isConfirmed: boolean;
}

// An unclosed "[?" runs to the end of the string, so a typo still renders as unconfirmed.
const UNCONFIRMED_MARKER = /\[\?[^\]]*\]?/g;

// Markers stay verbatim in the output so the visitor-facing text shows the open question itself.
export function splitUnconfirmed(copy: string): CopySegment[] {
  const segments: CopySegment[] = [];
  let cursor = 0;
  for (const match of copy.matchAll(UNCONFIRMED_MARKER)) {
    const start = match.index!;
    if (start > cursor) segments.push({ text: copy.slice(cursor, start), isConfirmed: true });
    segments.push({ text: match[0], isConfirmed: false });
    cursor = start + match[0].length;
  }
  if (cursor < copy.length) segments.push({ text: copy.slice(cursor), isConfirmed: true });
  return segments;
}
