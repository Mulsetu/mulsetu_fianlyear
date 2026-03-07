import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Breakpoints
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
};

// Screen size detection
export const isMobile = width < BREAKPOINTS.mobile;
export const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
export const isDesktop = width >= BREAKPOINTS.tablet;

// Responsive values
export const getResponsiveValue = (mobile: any, tablet?: any, desktop?: any) => {
  if (isDesktop && desktop !== undefined) return desktop;
  if (isTablet && tablet !== undefined) return tablet;
  return mobile;
};

// Responsive dimensions
export const getResponsiveDimensions = () => {
  return {
    containerMaxWidth: getResponsiveValue('100%', '600px', '800px'),
    formWidth: getResponsiveValue('100%', '500px', '600px'),
    paddingHorizontal: getResponsiveValue(24, 32, 48),
    paddingVertical: getResponsiveValue(32, 48, 64),
  };
};

