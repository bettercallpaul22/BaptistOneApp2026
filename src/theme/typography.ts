export const fontFamilies = {
  primary: "'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
  display: "'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
  mono: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
} as const;

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

export const typography = {
  displayLarge: { fontFamily: fontFamilies.display, fontSize: '4rem', fontWeight: fontWeights.extrabold, lineHeight: '4.5rem', letterSpacing: '0' },
  displayMedium: { fontFamily: fontFamilies.display, fontSize: '3rem', fontWeight: fontWeights.bold, lineHeight: '3.5rem', letterSpacing: '0' },
  displaySmall: { fontFamily: fontFamilies.display, fontSize: '2.25rem', fontWeight: fontWeights.bold, lineHeight: '2.75rem', letterSpacing: '0' },
  h1: { fontFamily: fontFamilies.display, fontSize: '2rem', fontWeight: fontWeights.bold, lineHeight: '2.5rem', letterSpacing: '0' },
  h2: { fontFamily: fontFamilies.display, fontSize: '1.75rem', fontWeight: fontWeights.bold, lineHeight: '2.25rem', letterSpacing: '0' },
  h3: { fontFamily: fontFamilies.display, fontSize: '1.5rem', fontWeight: fontWeights.semibold, lineHeight: '2rem', letterSpacing: '0' },
  h4: { fontFamily: fontFamilies.display, fontSize: '1.25rem', fontWeight: fontWeights.semibold, lineHeight: '1.75rem', letterSpacing: '0' },
  h5: { fontFamily: fontFamilies.display, fontSize: '1.125rem', fontWeight: fontWeights.semibold, lineHeight: '1.5rem', letterSpacing: '0' },
  h6: { fontFamily: fontFamilies.display, fontSize: '1rem', fontWeight: fontWeights.semibold, lineHeight: '1.375rem', letterSpacing: '0' },
  subtitle: { fontFamily: fontFamilies.primary, fontSize: '0.875rem', fontWeight: fontWeights.semibold, lineHeight: '1.25rem', letterSpacing: '0' },
  bodyLarge: { fontFamily: fontFamilies.primary, fontSize: '1rem', fontWeight: fontWeights.regular, lineHeight: '1.625rem', letterSpacing: '0' },
  bodyMedium: { fontFamily: fontFamilies.primary, fontSize: '0.875rem', fontWeight: fontWeights.regular, lineHeight: '1.375rem', letterSpacing: '0' },
  bodySmall: { fontFamily: fontFamilies.primary, fontSize: '0.75rem', fontWeight: fontWeights.regular, lineHeight: '1.125rem', letterSpacing: '0' },
  caption: { fontFamily: fontFamilies.primary, fontSize: '0.6875rem', fontWeight: fontWeights.medium, lineHeight: '1rem', letterSpacing: '0' },
  label: { fontFamily: fontFamilies.primary, fontSize: '0.75rem', fontWeight: fontWeights.semibold, lineHeight: '1rem', letterSpacing: '0' },
  overline: { fontFamily: fontFamilies.primary, fontSize: '0.6875rem', fontWeight: fontWeights.bold, lineHeight: '1rem', letterSpacing: '0.08em', textTransform: 'uppercase' },
} as const;

export type TypographyVariant = keyof typeof typography;
export type FontWeightToken = keyof typeof fontWeights;
