import { type ReactNode, useMemo, useState } from 'react';
import clsx from 'clsx';

export interface AppTickerProps {
  items: ReactNode[];
  speedSeconds?: number;
  pauseOnHover?: boolean;
  controls?: boolean;
}

export const AppTicker = ({ items, speedSeconds = 24, pauseOnHover = true, controls = false }: AppTickerProps) => {
  const [paused, setPaused] = useState(false);
  const trackItems = useMemo(() => [...items, ...items], [items]);

  return (
    <div className="flex w-full min-w-0 items-center gap-3">
      <div
        className={clsx('group min-w-0 flex-1 overflow-hidden', paused && '[&_div]:[animation-play-state:paused]')}
        style={{ '--ticker-speed': `${speedSeconds}s` } as React.CSSProperties}
      >
        <div
          className={clsx(
            'flex w-max gap-3 [animation:ticker_var(--ticker-speed)_linear_infinite]',
            pauseOnHover && 'group-hover:[animation-play-state:paused]',
          )}
        >
          {trackItems.map((item, index) => (
            <span
              className="inline-flex min-h-8 flex-none items-center rounded-full border border-white/20 px-3.5 text-[0.8125rem] font-bold text-white"
              key={index}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
      {controls && (
        <button
          className="flex-none rounded-full border border-[#D6DEEB] bg-white px-3 py-1.5 text-sm font-bold text-[#123B8D]"
          type="button"
          onClick={() => setPaused((state) => !state)}
        >
          {paused ? 'Play' : 'Pause'}
        </button>
      )}
    </div>
  );
};
