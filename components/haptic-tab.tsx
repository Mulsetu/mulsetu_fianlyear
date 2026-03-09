import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

export function HapticTab(props: BottomTabBarButtonProps) {
  const { style, pointerEvents, ...restProps } = props as BottomTabBarButtonProps & {
    style?: BottomTabBarButtonProps['style'];
    pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
  };

  return (
    <PlatformPressable
      {...restProps}
      style={[style, pointerEvents ? { pointerEvents } : null]}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        restProps.onPressIn?.(ev);
      }}
    />
  );
}
