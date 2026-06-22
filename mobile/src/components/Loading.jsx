import { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';

const CONFIG = {
  full:   { size: 38, border: 3 },
  inline: { size: 22, border: 2.5 },
  button: { size: 18, border: 2 },
};

export function Loading({ variant = 'full', color = '#CC1A1A', style }) {
  const rotation = useRef(new Animated.Value(0)).current;
  const fadeOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 750,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const isLight = color === '#fff' || color === '#ffffff' || color === 'white';
  const trackColor = isLight ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.08)';
  const { size, border } = CONFIG[variant] ?? CONFIG.full;

  const ringStyle = {
    width: size, height: size, borderRadius: size / 2,
    borderWidth: border, borderColor: trackColor,
    borderTopColor: color, transform: [{ rotate }],
  };

  if (variant === 'full') {
    return (
      <Animated.View style={[s.full, { opacity: fadeOpacity }, style]}>
        <Animated.View style={ringStyle} />
      </Animated.View>
    );
  }

  return <Animated.View style={[ringStyle, style]} />;
}

const s = StyleSheet.create({
  full: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
