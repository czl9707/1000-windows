export interface ChapterItem {
  slug: string;
  number: number;
  title: string;
}

export interface TocHeading {
  slug: string;
  text: string;
  depth: number;
}

export interface ChapterLayoutProps {
  chapters: ChapterItem[];
  chapter: ChapterItem;
  headings: TocHeading[];
  prev?: ChapterItem;
  next?: ChapterItem;
}
