/**
 * Toasty OS Design System Foundations
 *
 * Defines the core design tokens used throughout the application:
 * - Spacing scale
 * - Typography hierarchy
 * - Border radius system
 * - Shadow/elevation system
 * - Duration and easing for transitions
 */


/**
 * SPACING SCALE
 * Based on 4px grid for consistency and scalability
 */
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
}

/**
 * TYPOGRAPHY HIERARCHY
 * Establishes clear visual hierarchy for information density
 */
export const typography = {
  // Display / Page titles
  display: 'text-4xl font-bold tracking-tight leading-none',

  // Section titles
  heading: 'text-2xl font-semibold tracking-tight leading-snug',

  // Card titles
  title: 'text-xl font-semibold tracking-tight leading-snug',

  // Metrics / KPIs / Numbers
  metric: 'text-3xl font-bold tracking-tight leading-none',

  // Labels / Form field labels
  label: 'text-sm font-medium text-[hsl(var(--muted-foreground))]',

  // Body text
  body: 'text-base leading-relaxed',

  // Helper text / Form hints
  helper: 'text-xs text-[hsl(var(--muted-foreground))] leading-none',

  // Metadata / Captions / Timestamps
  caption: 'text-xs text-[hsl(var(--muted-foreground))] leading-none tracking-tight',

  // Overline / Tags / Small labels
  overline: 'text-xs font-medium text-[hsl(var(--primary))] tracking-wider uppercase',
}

/**
 * BORDER RADIUS SYSTEM
 * Defines radius usage for different surface types
 */
export const radius = {
  none: '0px',
  sm: '2px',      // 0.125rem - for fine details
  md: '4px',      // 0.25rem - standard inputs, buttons
  lg: '6px',      // 0.375rem - cards, panels
  xl: '8px',      // 0.5rem - modals, drawers
  '2xl': '12px',  // 0.75rem - special containers
  full: '9999px', // for pills, avatars
}

/**
 * SHADOW / ELEVATION SYSTEM
 * Creates surface hierarchy through elevation
 */
export const shadow = {
  none: '0 0 #0000',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',      // 1 - subtle elevation
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // 2 - cards, panels
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.1)', // 3 - elevated surfaces
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', // 4 - modals, drawers
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)', // 5 - full-screen overlays
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.06)', // inner shadow for pressed states
}

/**
 * TRANSITION DURATIONS & EASING
 * Consistent motion for microinteractions
 */
export const transition = {
  // Durations
  duration: {
    fastest: '50ms',
    faster: '100ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },

  // Easing curves
  easing: {
    'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
    'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
}

/**
 * Utility types for design system usage
 */
export type Spacing = keyof typeof spacing
export type Typography = keyof typeof typography
export type Radius = keyof typeof radius
export type Shadow = keyof typeof shadow
export type TransitionDuration = keyof typeof transition.duration
export type TransitionEasing = keyof typeof transition.easing

/**
 * Helper functions for converting design tokens to string values
 */
export function getSpacing(value: Spacing): string {
  return spacing[value]
}

export function getTypography(value: Typography): string {
  return typography[value]
}

export function getRadius(value: Radius): string {
  return radius[value]
}

export function getShadow(value: Shadow): string {
  return shadow[value]
}

export function getTransition(
  duration: TransitionDuration = 'normal',
  easing: TransitionEasing = 'ease-in-out'
): string {
  return `${transition.duration[duration]} ${transition.easing[easing]}`
}