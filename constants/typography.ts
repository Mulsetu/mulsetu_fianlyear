import { isDesktop } from '@/utils/responsive';
import { Platform } from 'react-native';

// Font sizes
export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  xxxxl: 32,
  xxxxxl: 36,
  xxxxxxl: 48,
} as const;

// Responsive font sizes
export const getFontSize = (size: keyof typeof fontSizes) => {
  const baseSize = fontSizes[size];
  return isDesktop ? baseSize * 1.2 : baseSize;
};

// Font weights
export const fontWeights = {
  thin: '100' as const,
  ultraLight: '200' as const,
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
  black: '900' as const,
} as const;

// Line heights
export const lineHeights = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

// Letter spacing
export const letterSpacing = {
  tighter: -0.05,
  tight: -0.025,
  normal: 0,
  wide: 0.025,
  wider: 0.05,
  widest: 0.1,
} as const;

// Typography styles
export const typography = {
  // Headings
  h1: {
    fontSize: getFontSize('xxxxxl'),
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.tight,
    fontFamily: 'System',
  },
  h2: {
    fontSize: getFontSize('xxxxl'),
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.tight,
    fontFamily: 'System',
  },
  h3: {
    fontSize: getFontSize('xxxl'),
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacing.normal,
    fontFamily: 'System',
  },
  h4: {
    fontSize: getFontSize('xxl'),
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacing.normal,
    fontFamily: 'System',
  },
  h5: {
    fontSize: getFontSize('xl'),
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: 'System',
  },
  h6: {
    fontSize: getFontSize('lg'),
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: 'System',
  },
  
  // Body text
  body1: {
    fontSize: getFontSize('md'),
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: 'System',
  },
  body2: {
    fontSize: getFontSize('sm'),
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: 'System',
  },
  
  // Small text
  caption: {
    fontSize: getFontSize('xs'),
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.wide,
    fontFamily: 'System',
  },
  
  // Button text
  button: {
    fontSize: getFontSize('md'),
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.wide,
    fontFamily: 'System',
  },
  buttonSmall: {
    fontSize: getFontSize('sm'),
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.wide,
    fontFamily: 'System',
  },
  buttonLarge: {
    fontSize: getFontSize('lg'),
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.wide,
    fontFamily: 'System',
  },
  
  // Label text
  label: {
    fontSize: getFontSize('sm'),
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.wide,
    fontFamily: 'System',
  },
  
  // Overline text
  overline: {
    fontSize: getFontSize('xs'),
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.widest,
    fontFamily: 'System',
    textTransform: 'uppercase' as const,
  },
  
  // Subtitle
  subtitle1: {
    fontSize: getFontSize('md'),
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: 'System',
  },
  subtitle2: {
    fontSize: getFontSize('sm'),
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
    fontFamily: 'System',
  },
} as const;

// Text alignment
export const textAlign = {
  left: { textAlign: 'left' as const },
  center: { textAlign: 'center' as const },
  right: { textAlign: 'right' as const },
  justify: { textAlign: 'justify' as const },
} as const;

// Text decoration
export const textDecoration = {
  none: { textDecorationLine: 'none' as const },
  underline: { textDecorationLine: 'underline' as const },
  lineThrough: { textDecorationLine: 'line-through' as const },
  underlineLineThrough: { textDecorationLine: 'underline line-through' as const },
} as const;

// Text transform
export const textTransform = {
  none: { textTransform: 'none' as const },
  uppercase: { textTransform: 'uppercase' as const },
  lowercase: { textTransform: 'lowercase' as const },
  capitalize: { textTransform: 'capitalize' as const },
} as const;

// Font styles
export const fontStyles = {
  normal: { fontStyle: 'normal' as const },
  italic: { fontStyle: 'italic' as const },
} as const;

// Platform-specific typography adjustments
export const platformTypography = Platform.select({
  ios: {
    // iOS-specific typography adjustments
    h1: {
      ...typography.h1,
      fontWeight: fontWeights.bold,
    },
    h2: {
      ...typography.h2,
      fontWeight: fontWeights.bold,
    },
  },
  android: {
    // Android-specific typography adjustments
    h1: {
      ...typography.h1,
      fontWeight: fontWeights.bold,
    },
    h2: {
      ...typography.h2,
      fontWeight: fontWeights.bold,
    },
  },
  default: {
    // Default typography
    h1: typography.h1,
    h2: typography.h2,
  },
});

// Utility function to combine typography styles
export const combineTypography = (...styles: any[]) => {
  return Object.assign({}, ...styles);
};

// Common text style combinations
export const commonTextStyles = {
  // Page titles
  pageTitle: combineTypography(
    typography.h1,
    textAlign.center,
    { marginBottom: 16 }
  ),
  
  // Section titles
  sectionTitle: combineTypography(
    typography.h3,
    { marginBottom: 12 }
  ),
  
  // Card titles
  cardTitle: combineTypography(
    typography.h4,
    { marginBottom: 8 }
  ),
  
  // Card subtitles
  cardSubtitle: combineTypography(
    typography.body2,
    { color: '#6c757d' }
  ),
  
  // Button text
  buttonText: combineTypography(
    typography.button,
    textAlign.center
  ),
  
  // Input labels
  inputLabel: combineTypography(
    typography.label,
    { marginBottom: 8 }
  ),
  
  // Error text
  errorText: combineTypography(
    typography.caption,
    { color: '#dc3545', marginTop: 4 }
  ),
  
  // Success text
  successText: combineTypography(
    typography.caption,
    { color: '#28a745', marginTop: 4 }
  ),
  
  // Muted text
  mutedText: combineTypography(
    typography.body2,
    { color: '#6c757d' }
  ),
  
  // Price text
  priceText: combineTypography(
    typography.h4,
    { color: '#60941a', fontWeight: fontWeights.bold }
  ),
  
  // Currency text
  currencyText: combineTypography(
    typography.h3,
    { color: '#60941a', fontWeight: fontWeights.bold }
  ),
} as const;
