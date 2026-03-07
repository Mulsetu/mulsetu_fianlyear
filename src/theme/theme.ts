// Theme configuration: colors and simple text styles

export const colors = {
  primaryGreen: "#60941a",
  primaryTeal: "#19696c",
  white: "#ffffff",
  textDark: "#222222",
  textLight: "#777777",
} as const;

export type ThemeColors = typeof colors;

export type TextStyleConfig = {
  fontSize: number;
  lineHeight: number;
  fontWeight?: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
  color?: string;
};

export const textStyles: {
  heading: TextStyleConfig;
  subheading: TextStyleConfig;
  body: TextStyleConfig;
  caption: TextStyleConfig;
} = {
  heading: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    color: colors.textDark,
  },
  subheading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    color: colors.textDark,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
    color: colors.textDark,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
    color: colors.textLight,
  },
};

export type TextStyles = typeof textStyles;


