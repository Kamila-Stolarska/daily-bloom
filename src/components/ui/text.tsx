// Text primitive w stylu react-native-reusables — warianty typograficzne dla Daily Bloom.
// Pozwala spinać typografię w jednym miejscu zamiast inlinować className na każdym ekranie.

import * as React from 'react';
import { Text as RNText, type TextProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const textVariants = cva('text-ink', {
  variants: {
    variant: {
      // Nagłówki — Fraunces 700, ciasny tracking, tight leading
      display: 'font-serif-bold',
      h1: 'font-serif-bold',
      h2: 'font-serif-bold',
      h3: 'font-serif-medium',
      // Body — Inter
      body: 'font-sans',
      bodyMedium: 'font-sans-medium',
      // Małe sans label u góry ekranu / nad nagłówkiem
      eyebrow: 'font-sans-medium uppercase text-ink',
      // Mały sans muted
      caption: 'font-sans text-ink-muted',
      // Mini sans tracked — numerki w opcjach itp.
      mono: 'font-sans text-ink-muted',
    },
    tone: {
      default: '',
      ink: 'text-ink',
      muted: 'text-ink-muted',
      paper: 'text-paper',
      'paper-muted': 'text-paper/70',
    },
  },
  defaultVariants: {
    variant: 'body',
    tone: 'default',
  },
});

const variantStyle: Record<
  NonNullable<VariantProps<typeof textVariants>['variant']>,
  { fontSize: number; lineHeight: number; letterSpacing: number }
> = {
  display: { fontSize: 52, lineHeight: 52, letterSpacing: -1.6 },
  h1: { fontSize: 40, lineHeight: 42, letterSpacing: -1.2 },
  h2: { fontSize: 28, lineHeight: 32, letterSpacing: -0.8 },
  h3: { fontSize: 19, lineHeight: 24, letterSpacing: -0.3 },
  body: { fontSize: 15, lineHeight: 22, letterSpacing: 0 },
  bodyMedium: { fontSize: 15, lineHeight: 22, letterSpacing: 0.2 },
  eyebrow: { fontSize: 11, lineHeight: 14, letterSpacing: 2 },
  caption: { fontSize: 13, lineHeight: 19, letterSpacing: 0 },
  mono: { fontSize: 11, lineHeight: 14, letterSpacing: 1.6 },
};

export type TextVariant = NonNullable<VariantProps<typeof textVariants>['variant']>;

type Props = TextProps &
  VariantProps<typeof textVariants> & {
    className?: string;
  };

export const Text = React.forwardRef<RNText, Props>(
  ({ className, variant, tone, style, ...props }, ref) => {
    const v = variant ?? 'body';
    return (
      <RNText
        ref={ref}
        className={cn(textVariants({ variant, tone }), className)}
        style={[variantStyle[v], style]}
        {...props}
      />
    );
  },
);
Text.displayName = 'Text';
