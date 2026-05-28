// Button primitive w stylu react-native-reusables (Pressable + cva + Slot).
// Warianty dopasowane do Daily Bloom: pill (z ikoną), solid, ghost, link.

import * as React from 'react';
import { Pressable, View, type PressableProps } from 'react-native';
import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import Svg, { Path } from 'react-native-svg';
import { cn } from '../../lib/utils';
import { Text } from './text';

const buttonVariants = cva(
  'flex-row items-center rounded-full',
  {
    variants: {
      variant: {
        // Czarny pill z label po lewej + arrow w kółku po prawej (jak na referencji Josh).
        pill: 'justify-between py-2 pl-6 pr-2 bg-ink',
        // Pełny czarny pill, label wycentrowany.
        solid: 'justify-center py-4 px-6 bg-ink',
        // Przezroczysty z ramką.
        ghost: 'justify-center py-3 px-5 border border-ink-muted/30 bg-paper',
        // Link tekstowy, bez tła.
        link: 'justify-center py-1 px-0 bg-transparent',
      },
      disabled: {
        true: 'opacity-40',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'pill',
      disabled: false,
    },
  },
);

type PillArrowProps = { tone?: 'ink' | 'paper' };
function PillArrow({ tone = 'ink' }: PillArrowProps) {
  const bg = tone === 'paper' ? 'bg-paper' : 'bg-ink';
  const stroke = tone === 'paper' ? '#1A1614' : '#F6F6EA';
  return (
    <View className={cn('w-11 h-11 rounded-full items-center justify-center', bg)}>
      <Svg width={14} height={14} viewBox="0 0 14 14">
        <Path
          d="M3 11 L11 3 M5 3 H11 V9"
          stroke={stroke}
          strokeWidth={1.4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

type ButtonProps = Omit<PressableProps, 'disabled'> &
  VariantProps<typeof buttonVariants> & {
    label?: string;
    asChild?: boolean;
    className?: string;
    children?: React.ReactNode;
  };

export const Button = React.forwardRef<View, ButtonProps>(
  (
    {
      variant = 'pill',
      disabled = false,
      label,
      asChild,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp: any = asChild ? Slot : Pressable;

    // Mapowanie wariantu na zawartość — pill ma label + arrow w paper-okręgu.
    const content = (() => {
      if (children) return children;
      if (variant === 'pill') {
        return (
          <>
            <Text variant="bodyMedium" tone="paper">
              {label}
            </Text>
            <PillArrow tone="paper" />
          </>
        );
      }
      if (variant === 'solid') {
        return (
          <Text variant="bodyMedium" tone="paper">
            {label}
          </Text>
        );
      }
      if (variant === 'ghost') {
        return (
          <Text variant="bodyMedium" tone="ink">
            {label}
          </Text>
        );
      }
      // link
      return (
        <Text variant="caption" tone="muted">
          {label}
        </Text>
      );
    })();

    return (
      <Comp
        ref={ref}
        disabled={!!disabled}
        accessibilityRole="button"
        className={cn(buttonVariants({ variant, disabled }), className)}
        {...props}
      >
        {content}
      </Comp>
    );
  },
);
Button.displayName = 'Button';
