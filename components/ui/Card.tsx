import { Colors } from '@/constants/theme';
import { isDesktop } from '@/utils/responsive';
import React from 'react';
import {
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

interface CardProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  variant?: 'default' | 'outlined' | 'elevated';
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  testID?: string;
}

export default function Card({
  children,
  title,
  subtitle,
  onPress,
  variant = 'default',
  style,
  titleStyle,
  subtitleStyle,
  testID,
}: CardProps) {
  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[
        styles.card,
        styles[variant],
        onPress && styles.pressable,
        style,
      ]}
      onPress={onPress}
      testID={testID}
    >
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <Text style={[styles.title, titleStyle]}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={[styles.subtitle, subtitleStyle]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      
      {children && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  
  // Variants
  default: {
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  outlined: {
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  
  // States
  pressable: {
    // Add any pressable-specific styles
  },
  
  // Layout
  header: {
    marginBottom: 16,
  },
  content: {
    // Content styles
  },
  
  // Text styles
  title: {
    fontSize: isDesktop ? 20 : 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: isDesktop ? 16 : 14,
    color: Colors.light.icon,
    fontFamily: 'System',
  },
});
