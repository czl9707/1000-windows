// The NN- folder prefix is the chapter's order; the folder name is the only
// place the reading order lives.

export function chapterSlug(id: string): string {
  return id.replace(/^\d+-/, '');
}

export function chapterNumber(id: string): number {
  const n = Number.parseInt(id, 10);
  if (Number.isNaN(n)) throw new Error(`chapter id "${id}" lacks its NN- order prefix`);
  return n;
}
