export interface DecisionEntry {
  title: string;
  date: string;
  gist: string;
  ticket: string;
}

export const decisions: DecisionEntry[] = [
  {
    title: 'How the reference actually builds it — chapter digest',
    date: '2026-10-30',
    gist:
      'Deterministic via seed-hash + append-only draw order + named warp traces cached per pen; ~3 ms/frame for 9 heads means the wall must pre-render window scenes keyed by window seed, not recompute per frame.',
    ticket: 'wayfinder/tickets/001-reference-digest.md',
  },
];
