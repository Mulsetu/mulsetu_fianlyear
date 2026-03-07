import { isDesktop } from '@/utils/responsive';

// Spacing scale (based on 8px grid)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// Responsive spacing
export const getSpacing = (size: keyof typeof spacing) => {
  const baseSpacing = spacing[size];
  return isDesktop ? baseSpacing * 1.5 : baseSpacing;
};

// Padding utilities
export const padding = {
  xs: { padding: spacing.xs },
  sm: { padding: spacing.sm },
  md: { padding: spacing.md },
  lg: { padding: spacing.lg },
  xl: { padding: spacing.xl },
  xxl: { padding: spacing.xxl },
  xxxl: { padding: spacing.xxxl },
  
  // Horizontal padding
  horizontal: {
    xs: { paddingHorizontal: spacing.xs },
    sm: { paddingHorizontal: spacing.sm },
    md: { paddingHorizontal: spacing.md },
    lg: { paddingHorizontal: spacing.lg },
    xl: { paddingHorizontal: spacing.xl },
    xxl: { paddingHorizontal: spacing.xxl },
    xxxl: { paddingHorizontal: spacing.xxxl },
  },
  
  // Vertical padding
  vertical: {
    xs: { paddingVertical: spacing.xs },
    sm: { paddingVertical: spacing.sm },
    md: { paddingVertical: spacing.md },
    lg: { paddingVertical: spacing.lg },
    xl: { paddingVertical: spacing.xl },
    xxl: { paddingVertical: spacing.xxl },
    xxxl: { paddingVertical: spacing.xxxl },
  },
  
  // Top padding
  top: {
    xs: { paddingTop: spacing.xs },
    sm: { paddingTop: spacing.sm },
    md: { paddingTop: spacing.md },
    lg: { paddingTop: spacing.lg },
    xl: { paddingTop: spacing.xl },
    xxl: { paddingTop: spacing.xxl },
    xxxl: { paddingTop: spacing.xxxl },
  },
  
  // Bottom padding
  bottom: {
    xs: { paddingBottom: spacing.xs },
    sm: { paddingBottom: spacing.sm },
    md: { paddingBottom: spacing.md },
    lg: { paddingBottom: spacing.lg },
    xl: { paddingBottom: spacing.xl },
    xxl: { paddingBottom: spacing.xxl },
    xxxl: { paddingBottom: spacing.xxxl },
  },
  
  // Left padding
  left: {
    xs: { paddingLeft: spacing.xs },
    sm: { paddingLeft: spacing.sm },
    md: { paddingLeft: spacing.md },
    lg: { paddingLeft: spacing.lg },
    xl: { paddingLeft: spacing.xl },
    xxl: { paddingLeft: spacing.xxl },
    xxxl: { paddingLeft: spacing.xxxl },
  },
  
  // Right padding
  right: {
    xs: { paddingRight: spacing.xs },
    sm: { paddingRight: spacing.sm },
    md: { paddingRight: spacing.md },
    lg: { paddingRight: spacing.lg },
    xl: { paddingRight: spacing.xl },
    xxl: { paddingRight: spacing.xxl },
    xxxl: { paddingRight: spacing.xxxl },
  },
} as const;

// Margin utilities
export const margin = {
  xs: { margin: spacing.xs },
  sm: { margin: spacing.sm },
  md: { margin: spacing.md },
  lg: { margin: spacing.lg },
  xl: { margin: spacing.xl },
  xxl: { margin: spacing.xxl },
  xxxl: { margin: spacing.xxxl },
  
  // Horizontal margin
  horizontal: {
    xs: { marginHorizontal: spacing.xs },
    sm: { marginHorizontal: spacing.sm },
    md: { marginHorizontal: spacing.md },
    lg: { marginHorizontal: spacing.lg },
    xl: { marginHorizontal: spacing.xl },
    xxl: { marginHorizontal: spacing.xxl },
    xxxl: { marginHorizontal: spacing.xxxl },
  },
  
  // Vertical margin
  vertical: {
    xs: { marginVertical: spacing.xs },
    sm: { marginVertical: spacing.sm },
    md: { marginVertical: spacing.md },
    lg: { marginVertical: spacing.lg },
    xl: { marginVertical: spacing.xl },
    xxl: { marginVertical: spacing.xxl },
    xxxl: { marginVertical: spacing.xxxl },
  },
  
  // Top margin
  top: {
    xs: { marginTop: spacing.xs },
    sm: { marginTop: spacing.sm },
    md: { marginTop: spacing.md },
    lg: { marginTop: spacing.lg },
    xl: { marginTop: spacing.xl },
    xxl: { marginTop: spacing.xxl },
    xxxl: { marginTop: spacing.xxxl },
  },
  
  // Bottom margin
  bottom: {
    xs: { marginBottom: spacing.xs },
    sm: { marginBottom: spacing.sm },
    md: { marginBottom: spacing.md },
    lg: { marginBottom: spacing.lg },
    xl: { marginBottom: spacing.xl },
    xxl: { marginBottom: spacing.xxl },
    xxxl: { marginBottom: spacing.xxxl },
  },
  
  // Left margin
  left: {
    xs: { marginLeft: spacing.xs },
    sm: { marginLeft: spacing.sm },
    md: { marginLeft: spacing.md },
    lg: { marginLeft: spacing.lg },
    xl: { marginLeft: spacing.xl },
    xxl: { marginLeft: spacing.xxl },
    xxxl: { marginLeft: spacing.xxxl },
  },
  
  // Right margin
  right: {
    xs: { marginRight: spacing.xs },
    sm: { marginRight: spacing.sm },
    md: { marginRight: spacing.md },
    lg: { marginRight: spacing.lg },
    xl: { marginRight: spacing.xl },
    xxl: { marginRight: spacing.xxl },
    xxxl: { marginRight: spacing.xxxl },
  },
} as const;

// Gap utilities
export const gap = {
  xs: { gap: spacing.xs },
  sm: { gap: spacing.sm },
  md: { gap: spacing.md },
  lg: { gap: spacing.lg },
  xl: { gap: spacing.xl },
  xxl: { gap: spacing.xxl },
  xxxl: { gap: spacing.xxxl },
} as const;

// Border radius utilities
export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

// Shadow utilities
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// Layout utilities
export const layout = {
  // Flex utilities
  flex: {
    row: { flexDirection: 'row' as const },
    column: { flexDirection: 'column' as const },
    wrap: { flexWrap: 'wrap' as const },
    nowrap: { flexWrap: 'nowrap' as const },
    center: { justifyContent: 'center' as const, alignItems: 'center' as const },
    start: { justifyContent: 'flex-start' as const, alignItems: 'flex-start' as const },
    end: { justifyContent: 'flex-end' as const, alignItems: 'flex-end' as const },
    between: { justifyContent: 'space-between' as const },
    around: { justifyContent: 'space-around' as const },
    evenly: { justifyContent: 'space-evenly' as const },
  },
  
  // Position utilities
  position: {
    relative: { position: 'relative' as const },
    absolute: { position: 'absolute' as const },
    fixed: { position: 'absolute' as const }, // React Native doesn't have fixed
  },
  
  // Display utilities
  display: {
    none: { display: 'none' as const },
    flex: { display: 'flex' as const },
  },
  
  // Overflow utilities
  overflow: {
    visible: { overflow: 'visible' as const },
    hidden: { overflow: 'hidden' as const },
    scroll: { overflow: 'scroll' as const },
  },
} as const;
