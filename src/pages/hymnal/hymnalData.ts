import hymnalData from '@/assets/hymnal/hymnal.json';

export interface HymnVerse {
  number: number;
  text: string;
}

export interface Hymn {
  id: string;
  number: number;
  title: string;
  verses: HymnVerse[];
}

export interface HymnSearchResult {
  hymn: Hymn;
  matchType: 'number' | 'title' | 'lyrics';
  preview: string;
}

const hymns = hymnalData as Hymn[];

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const splitLongLine = (line: string): string[] => {
  if (line.length <= 74) return [line];

  const commaIndex = line.lastIndexOf(',', 62);

  if (commaIndex >= 34) {
    return [line.slice(0, commaIndex + 1).trim(), ...splitLongLine(line.slice(commaIndex + 1).trim())];
  }

  const words = line.split(' ');
  const lines: string[] = [];
  let nextLine = '';

  for (const word of words) {
    const candidate = nextLine ? `${nextLine} ${word}` : word;

    if (candidate.length > 66 && nextLine) {
      lines.push(nextLine);
      nextLine = word;
    } else {
      nextLine = candidate;
    }
  }

  if (nextLine) lines.push(nextLine);

  return lines;
};

export const getHymns = () => hymns;

export const getHymnById = (id: string) => hymns.find((hymn) => hymn.id === id);

export const formatHymnVerseLines = (text: string) => {
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  const phraseLines = normalizedText
    .split(/(?<=[;:!?])\s+|(?<=\.)\s+(?=[A-Z"'])/g)
    .map((line) => line.trim())
    .filter(Boolean);

  return phraseLines.flatMap(splitLongLine);
};

export const searchHymns = (query: string, limit = 50): HymnSearchResult[] => {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return hymns.slice(0, limit).map((hymn) => ({
      hymn,
      matchType: 'title',
      preview: `${hymn.verses.length} verses`,
    }));
  }

  const results: HymnSearchResult[] = [];

  for (const hymn of hymns) {
    const hymnNumber = String(hymn.number);
    const normalizedTitle = normalizeText(hymn.title);

    if (hymnNumber.includes(normalizedQuery)) {
      results.push({
        hymn,
        matchType: 'number',
        preview: `Hymn ${hymn.number}`,
      });
    } else if (normalizedTitle.includes(normalizedQuery)) {
      results.push({
        hymn,
        matchType: 'title',
        preview: hymn.title,
      });
    } else {
      const matchedVerse = hymn.verses.find((verse) => normalizeText(verse.text).includes(normalizedQuery));

      if (matchedVerse) {
        results.push({
          hymn,
          matchType: 'lyrics',
          preview: matchedVerse.text,
        });
      }
    }

    if (results.length >= limit) break;
  }

  return results;
};
