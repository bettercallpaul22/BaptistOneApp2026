import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ListMusic, Music2, Search, X } from 'lucide-react';
import { AppButton, AppText } from '@/components/common';
import { useDeviceProfile } from '@/hooks/useDeviceProfile';
import { AppShell } from '@/layouts/AppShell';
import { formatHymnVerseLines, getHymns, searchHymns, type Hymn } from './hymnalData';

const hymns = getHymns();

const getAdjacentHymn = (hymn: Hymn, direction: 'previous' | 'next') => {
  const index = hymns.findIndex((item) => item.id === hymn.id);

  if (index < 0) return null;

  return hymns[direction === 'previous' ? index - 1 : index + 1] ?? null;
};

const getMatchLabel = (matchType: string) => {
  if (matchType === 'number') return 'Number match';
  if (matchType === 'lyrics') return 'Lyrics match';

  return 'Title match';
};

export default function HymnalPage() {
  const { isDesktop } = useDeviceProfile();
  const [selectedHymn, setSelectedHymn] = useState<Hymn>(hymns[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isReaderOpen, setIsReaderOpen] = useState(false);

  const searchResults = useMemo(() => searchHymns(searchQuery), [searchQuery]);
  const previousHymn = useMemo(() => getAdjacentHymn(selectedHymn, 'previous'), [selectedHymn]);
  const nextHymn = useMemo(() => getAdjacentHymn(selectedHymn, 'next'), [selectedHymn]);
  const showHymnList = isDesktop || !isReaderOpen;
  const showReader = isDesktop || isReaderOpen;

  const selectHymn = (hymn: Hymn) => {
    setSelectedHymn(hymn);
    setIsReaderOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-4rem)] bg-[#F6F8FC] px-4 py-5 sm:px-6 md:px-9 md:py-8">
        <div className="mx-auto grid max-w-[78rem] min-w-0 gap-5 xl:grid-cols-[23rem_minmax(0,1fr)]">
          {showHymnList && (
            <section className="grid min-w-0 gap-4 rounded-2xl border border-[#E5EAF3] bg-white p-5 shadow-[0_12px_30px_rgba(11,31,74,0.08)] xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:grid-rows-[auto_minmax(0,1fr)]">
              <div className="grid gap-4">
                <div className="flex items-center gap-3 text-[#123B8D]">
                  <span className="grid size-11 place-items-center rounded-xl bg-[#EAF1FF]">
                    <Music2 className="size-6" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <AppText variant="h3">Hymnal</AppText>
                    <AppText variant="bodySmall" color="textSecondary">
                      {hymns.length} hymns available
                    </AppText>
                  </div>
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-[#7B8798]" aria-hidden />
                  <input
                    className="min-h-12 w-full rounded-lg border border-[#D6DEEB] bg-white pr-11 pl-10 text-base font-semibold text-[#0B1F4A] outline-none transition placeholder:text-[#8A96A8] focus:border-[#123B8D] focus:ring-4 focus:ring-[#123B8D]/15"
                    value={searchQuery}
                    placeholder="Search hymn number, title, or lyrics"
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-[#46556E] transition hover:bg-[#F2F5FA]"
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  )}
                </div>
              </div>

              <div className="min-h-0 overflow-y-auto pr-1">
                <div className="grid gap-2">
                  {searchResults.map(({ hymn, matchType, preview }) => {
                    const active = hymn.id === selectedHymn.id;

                    return (
                      <button
                        className={`grid gap-1 rounded-xl border p-3 text-left transition ${
                          active
                            ? 'border-[#123B8D] bg-[#EAF1FF] text-[#0B1F4A]'
                            : 'border-[#E5EAF3] bg-white text-[#24344D] hover:border-[#B8C6E4] hover:bg-[#F8FAFE]'
                        }`}
                        key={hymn.id}
                        type="button"
                        onClick={() => selectHymn(hymn)}
                      >
                        <span className="text-sm font-black text-[#123B8D]">
                          {hymn.number}. {hymn.title}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#D4A017]">{getMatchLabel(matchType)}</span>
                        <span className="line-clamp-2 text-sm leading-6 text-[#5A6780]">{preview}</span>
                      </button>
                    );
                  })}

                  {searchResults.length === 0 && (
                    <p className="m-0 rounded-xl bg-[#F6F8FC] p-4 text-sm font-medium text-[#5A6780]">No hymns found.</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {showReader && (
          <section className="grid min-w-0 gap-5 rounded-2xl border border-[#E5EAF3] bg-white p-5 shadow-[0_10px_24px_rgba(11,31,74,0.05)] sm:p-7">
            <header className="grid gap-5 border-b border-[#EEF2F7] pb-5">
              {!isDesktop && (
                <div>
                  <AppButton variant="ghost" leftIcon={<ChevronLeft className="size-4" aria-hidden />} onClick={() => setIsReaderOpen(false)}>
                    Browse hymns
                  </AppButton>
                </div>
              )}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="grid min-w-0 gap-2">
                  <p className="m-0 text-sm font-black uppercase tracking-[0.18em] text-[#D4A017]">Hymn {selectedHymn.number}</p>
                  <h1 className="m-0 text-3xl font-black tracking-[0] text-[#0B1F4A] sm:text-4xl">{selectedHymn.title}</h1>
                  <AppText variant="bodyMedium" color="textSecondary">
                    {selectedHymn.verses.length} verses
                  </AppText>
                </div>
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#EAF1FF] text-[#123B8D]">
                  <ListMusic className="size-8" aria-hidden />
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <AppButton
                  variant="outline"
                  disabled={!previousHymn}
                  leftIcon={<ChevronLeft className="size-4" aria-hidden />}
                  onClick={() => previousHymn && selectHymn(previousHymn)}
                >
                  Previous
                </AppButton>
                <AppButton
                  variant="outline"
                  disabled={!nextHymn}
                  rightIcon={<ChevronRight className="size-4" aria-hidden />}
                  onClick={() => nextHymn && selectHymn(nextHymn)}
                >
                  Next
                </AppButton>
              </div>
            </header>

            <article className="grid gap-7">
              {selectedHymn.verses.map((verse) => (
                <section className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3" key={verse.number}>
                  <div className="pt-1">
                    <span className="grid size-8 place-items-center rounded-full bg-[#123B8D] text-sm font-black text-white">
                      {verse.number}
                    </span>
                  </div>
                  <div className="grid min-w-0 gap-1 border-t border-[#EEF2F7] pt-4">
                    {formatHymnVerseLines(verse.text).map((line, index) => (
                      <p
                        className="m-0 text-lg leading-8 tracking-[0] text-[#24344D] sm:text-xl sm:leading-9"
                        key={`${verse.number}-${index}`}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </article>
          </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}
