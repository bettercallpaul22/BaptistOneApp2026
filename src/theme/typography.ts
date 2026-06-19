export const fontFamilies = {
  primary: 'System',
  display: 'System',
  mono: 'Menlo',
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const typography = {
  displayLarge: { fontSize: 64, fontWeight: fontWeights.extrabold, lineHeight: 72 },
  displayMedium: { fontSize: 48, fontWeight: fontWeights.bold, lineHeight: 56 },
  displaySmall: { fontSize: 36, fontWeight: fontWeights.bold, lineHeight: 44 },
  h1: { fontSize: 32, fontWeight: fontWeights.bold, lineHeight: 40 },
  h2: { fontSize: 28, fontWeight: fontWeights.bold, lineHeight: 36 },
  h3: { fontSize: 24, fontWeight: fontWeights.semibold, lineHeight: 32 },
  h4: { fontSize: 20, fontWeight: fontWeights.semibold, lineHeight: 28 },
  h5: { fontSize: 18, fontWeight: fontWeights.semibold, lineHeight: 24 },
  h6: { fontSize: 16, fontWeight: fontWeights.semibold, lineHeight: 22 },
  subtitle: { fontSize: 14, fontWeight: fontWeights.semibold, lineHeight: 20 },
  bodyLarge: { fontSize: 16, fontWeight: fontWeights.regular, lineHeight: 26 },
  bodyMedium: { fontSize: 14, fontWeight: fontWeights.regular, lineHeight: 22 },
  bodySmall: { fontSize: 12, fontWeight: fontWeights.regular, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: fontWeights.medium, lineHeight: 16 },
  label: { fontSize: 12, fontWeight: fontWeights.semibold, lineHeight: 16 },
  overline: { fontSize: 11, fontWeight: fontWeights.bold, lineHeight: 16 },
} as const;

export type TypographyVariant = keyof typeof typography;
export type FontWeightToken = keyof typeof fontWeights;
