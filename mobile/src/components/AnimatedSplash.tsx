import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

interface AnimatedSplashProps {
  isReady: boolean;
  onFinish: () => void;
}

export default function AnimatedSplash({ isReady, onFinish }: AnimatedSplashProps) {
  const [visible, setVisible] = useState(true);

  // Entrance animations
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const dotScale = useSharedValue(0);

  // Exit animations
  const containerOpacity = useSharedValue(1);
  const containerScale = useSharedValue(1);

  // Run entrance animation on mount
  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 100 });

    dotScale.value = withDelay(
      300,
      withSpring(1, { damping: 10, stiffness: 200 })
    );

  }, []);

  // Run exit animation when ready
  useEffect(() => {
    if (!isReady) return;

    // Small delay so the user sees the splash briefly
    const timeout = setTimeout(() => {
      containerOpacity.value = withTiming(0, {
        duration: 400,
        easing: Easing.in(Easing.cubic),
      });
      containerScale.value = withTiming(1.05, {
        duration: 400,
        easing: Easing.in(Easing.cubic),
      }, (finished) => {
        if (finished) {
          runOnJS(setVisible)(false);
          runOnJS(onFinish)();
        }
      });
    }, 2400);

    return () => clearTimeout(timeout);
  }, [isReady]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotScale.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Animated.Text style={styles.logoText}>
          We
        </Animated.Text>
        <Animated.Text style={styles.logoTextAccent}>
          Vibe
        </Animated.Text>
        <Animated.View style={[styles.dot, dotStyle]} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoText: {
    fontSize: 48,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  logoTextAccent: {
    fontSize: 48,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    marginLeft: 2,
    marginBottom: 8,
  },
});
