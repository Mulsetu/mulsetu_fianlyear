import { Colors } from '@/constants/theme';
import { isDesktop } from '@/utils/responsive';
import React from 'react';
import {
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';

interface BadgeProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export default function Badge({
  text,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  testID,
}: BadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        styles[variant],
        styles[size],
        style,
      ]}
      testID={testID}
    >
      <Text style={[
        styles.text,
        styles[`${variant}Text`],
        styles[`${size}Text`],
        textStyle,
      ]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  
  // Variants
  primary: {
    backgroundColor: Colors.light.primary,
  },
  secondary: {
    backgroundColor: Colors.light.secondary,
  },
  success: {
    backgroundColor: Colors.light.success,
  },
  warning: {
    backgroundColor: Colors.light.warning,
  },
  error: {
    backgroundColor: Colors.light.error,
  },
  info: {
    backgroundColor: Colors.light.info,
  },
  
  // Sizes
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  medium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  large: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  
  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'System',
  },
  primaryText: {
    color: 'white',
  },
  secondaryText: {
    color: 'white',
  },
  successText: {
    color: 'white',
  },
  warningText: {
    color: 'white',
  },
  errorText: {
    color: 'white',
  },
  infoText: {
    color: 'white',
  },
  
  // Text sizes
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: isDesktop ? 14 : 12,
  },
});
