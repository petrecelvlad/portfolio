export interface EmphasisSegment {
  text: string;
  isEmphasized: boolean;
}

const EMPHASIS_MARKER = /\*\*([^*]+)\*\*/g;

// "**Name**" in a copy string renders bold; the asterisks never reach the visitor.
export function splitEmphasis(copy: string): EmphasisSegment[] {
  const segments: EmphasisSegment[] = [];
  let cursor = 0;
  for (const match of copy.matchAll(EMPHASIS_MARKER)) {
    const start = match.index!;
    if (start > cursor) segments.push({ text: copy.slice(cursor, start), isEmphasized: false });
    segments.push({ text: match[1], isEmphasized: true });
    cursor = start + match[0].length;
  }
  if (cursor < copy.length) segments.push({ text: copy.slice(cursor), isEmphasized: false });
  return segments;
}
