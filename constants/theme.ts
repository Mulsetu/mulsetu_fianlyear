/**
 * Mulsetu App Colors and Theme Configuration
 * Primary: #60941a (green, for buttons and highlights)
 * Secondary: #19696c (teal, for headers/accents)
 * Background: #ffffff (white)
 */

import { Platform } from 'react-native';

const primaryColor = '#60941a';
const secondaryColor = '#19696c';
const backgroundColor = '#ffffff';

export const Colors = {
  light: {
    text: '#11181C',
    background: backgroundColor,
    primary: primaryColor,
    secondary: secondaryColor,
    tint: primaryColor,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryColor,
    inputBackground: '#f8f9fa',
    border: '#e9ecef',
    error: '#dc3545',
    success: primaryColor,
    warning: '#ffc107',
    info: '#17a2b8',
    // Additional colors
    textSecondary: '#6c757d',
    textMuted: '#adb5bd',
    surface: '#ffffff',
    surfaceVariant: '#f8f9fa',
    outline: '#dee2e6',
    outlineVariant: '#e9ecef',
    // Status colors
    onError: '#ffffff',
    onSuccess: '#ffffff',
    onWarning: '#000000',
    onInfo: '#ffffff',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    // Semantic colors
    danger: '#dc3545',
    warningLight: '#fff3cd',
    successLight: '#d4edda',
    infoLight: '#d1ecf1',
    errorLight: '#f8d7da',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    primary: primaryColor,
    secondary: secondaryColor,
    tint: primaryColor,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: primaryColor,
    inputBackground: '#2d2d2d',
    border: '#404040',
    error: '#ff6b6b',
    success: primaryColor,
    warning: '#ffc107',
    info: '#17a2b8',
    // Additional colors
    textSecondary: '#adb5bd',
    textMuted: '#6c757d',
    surface: '#1a1a1a',
    surfaceVariant: '#2d2d2d',
    outline: '#404040',
    outlineVariant: '#333333',
    // Status colors
    onError: '#ffffff',
    onSuccess: '#ffffff',
    onWarning: '#000000',
    onInfo: '#ffffff',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    // Semantic colors
    danger: '#ff6b6b',
    warningLight: '#664d03',
    successLight: '#0f5132',
    infoLight: '#055160',
    errorLight: '#842029',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** Inter font for iOS */
    sans: 'Inter',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Inter',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'Inter', 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
