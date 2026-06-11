import { type CSSProperties, type ElementType, memo, type ReactNode } from 'react';
import clsx from 'clsx';
import { colors, fontWeights, typography, type ColorToken, type FontWeightToken, type TypographyVariant } from '@/theme';

type Align = 'left' | 'center' | 'right' | 'justify';

export interface AppTextProps {
  as?: ElementType;
  variant?: TypographyVariant;
  children?: ReactNode;
  className?: string;
  color?: ColorToken | 'inherit' | (string & {});
  weight?: FontWeightToken;
  align?: Align;
  lineClamp?: number;
  loading?: boolean;
  fontFamily?: string;
}

const variantElement: Record<TypographyVariant, ElementType> = {
  displayLarge: 'h1',
  displayMedium: 'h1',
  displaySmall: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  subtitle: 'p',
  bodyLarge: 'p',
  bodyMedium: 'p',
  bodySmall: 'p',
  caption: 'span',
  label: 'span',
  overline: 'span',
};

const resolveColor = (color?: AppTextProps['color']) => {
  if (!color || color === 'inherit') return color;
  return colors[color as ColorToken] ?? color;
};

const variantClasses: Record<TypographyVariant, string> = {
  displayLarge: 'text-[2.75rem] leading-[3.25rem] sm:text-[4rem] sm:leading-[4.5rem]',
  displayMedium: 'text-[2rem] leading-[2.5rem] sm:text-5xl sm:leading-[3.5rem]',
  displaySmall: 'text-[2rem] leading-[2.5rem] sm:text-4xl sm:leading-[2.75rem]',
  h1: 'text-[1.75rem] leading-[2.25rem] sm:text-3xl sm:leading-10',
  h2: 'text-[1.75rem] leading-9',
  h3: 'text-2xl leading-8',
  h4: 'text-xl leading-7',
  h5: 'text-lg leading-6',
  h6: 'text-base leading-[1.375rem]',
  subtitle: 'text-sm leading-5',
  bodyLarge: 'text-base leading-[1.625rem]',
  bodyMedium: 'text-sm leading-[1.375rem]',
  bodySmall: 'text-xs leading-[1.125rem]',
  caption: 'text-[0.6875rem] leading-4',
  label: 'text-xs leading-4',
  overline: 'text-[0.6875rem] leading-4 uppercase tracking-[0.08em]',
};

export const AppText = memo(
  ({
    as,
    variant = 'bodyMedium',
    children,
    className,
    color = 'textPrimary',
    weight,
    align = 'left',
    lineClamp,
    loading = false,
    fontFamily,
  }: AppTextProps) => {
    const Component = as ?? variantElement[variant];
    const token = typography[variant];
    const style: CSSProperties = {
      color: resolveColor(color),
      fontFamily: fontFamily ?? token.fontFamily,
      fontWeight: weight ? fontWeights[weight] : token.fontWeight,
      textAlign: align,
      letterSpacing: token.letterSpacing,
      ...(lineClamp
        ? {
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: lineClamp,
          }
        : {}),
    };

    return (
      <Component
        className={clsx(
          'm-0 [overflow-wrap:anywhere]',
          variantClasses[variant],
          loading && 'w-full max-w-72 animate-pulse rounded-md bg-slate-100 text-transparent',
          className,
        )}
        style={style}
      >
        {loading ? '\u00A0' : children}
      </Component>
    );
  },
);

AppText.displayName = 'AppText';
