import { type ReactNode } from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';
import { colors, fontWeights, typography, type ColorToken, type FontWeightToken, type TypographyVariant } from '../../theme';

type Align = 'left' | 'center' | 'right' | 'justify';

export interface AppTextProps {
  children?: ReactNode;
  variant?: TypographyVariant;
  color?: ColorToken | string;
  weight?: FontWeightToken;
  align?: Align;
  numberOfLines?: number;
  style?: TextStyle | TextStyle[];
}

export function AppText({
  children,
  variant = 'bodyMedium',
  color = 'textPrimary',
  weight,
  align = 'left',
  numberOfLines,
  style,
}: AppTextProps) {
  const token = typography[variant];
  const resolvedColor = colors[color as ColorToken] ?? color;

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        styles.text,
        {
          color: resolvedColor,
          fontSize: token.fontSize,
          fontWeight: weight ? fontWeights[weight] : token.fontWeight,
          lineHeight: token.lineHeight,
          textAlign: align,
          textTransform: variant === 'overline' ? 'uppercase' : 'none',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    flexShrink: 1,
  },
});
