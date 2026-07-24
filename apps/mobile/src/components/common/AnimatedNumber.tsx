import React, { useEffect, useRef } from 'react';
import { Text, Animated, StyleSheet, TextStyle, StyleProp } from 'react-native';

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: StyleProp<TextStyle>;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  prefix = '$',
  suffix = '',
  decimals = 2,
  style,
}) => {
  const prevValueRef = useRef(value);
  const flashAnim = useRef(new Animated.Value(0)).current; // -1 for red, 0 for neutral, 1 for green

  useEffect(() => {
    if (prevValueRef.current !== value) {
      const isIncrease = value > prevValueRef.current;
      prevValueRef.current = value;

      // Pulse green for increase, red for decrease
      flashAnim.setValue(isIncrease ? 1 : -1);

      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: false,
      }).start();
    }
  }, [value, flashAnim]);

  const textColor = flashAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['#EF4444', '#FFFFFF', '#10B981'],
  });

  const formatted = `${prefix}${value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${suffix}`;

  return (
    <Animated.Text style={[style, { color: textColor }]}>
      {formatted}
    </Animated.Text>
  );
};
