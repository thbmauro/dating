import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME_COLORS } from '@/lib/state/settings-store';
import useSettingsStore from '@/lib/state/settings-store';
import useIcebreakerStore, { Icebreaker } from '@/lib/state/icebreaker-store';
import { ChevronLeft, Bookmark } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const SWIPE_VELOCITY = 600;

// Same AnimatedWord as icebreakers
function AnimatedWord({ word, index, trigger }: { word: string; index: number; trigger: boolean }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    if (trigger) {
      const delay = index * 50;
      opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
      translateY.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 220 }));
    } else {
      opacity.value = 0;
      translateY.value = 10;
    }
  }, [trigger]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.Text style={[animStyle, { color: '#000000', fontSize: 24, lineHeight: 36, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 }]}>
      {word}{' '}
    </Animated.Text>
  );
}

// Same CardContent as icebreakers
function CardContent({ icebreaker, isfront }: { icebreaker: Icebreaker; isfront: boolean }) {
  const categoryTitle = icebreaker.category.charAt(0).toUpperCase() + icebreaker.category.slice(1);
  const words = icebreaker.question.split(' ');

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {words.map((word, i) => (
          <AnimatedWord key={`${i}-${word}`} word={word} index={i} trigger={isfront} />
        ))}
      </View>
      <View style={{ flex: 1 }} />
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: 'rgba(26,26,26,0.3)', letterSpacing: -0.5 }}>
        {categoryTitle}
      </Text>
    </View>
  );
}

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const themeColors = THEME_COLORS['neutral'];
  const savedCards = useIcebreakerStore((s) => s.savedCards);
  const removeSavedCard = useIcebreakerStore((s) => s.removeSavedCard);

  const [currentIndex, setCurrentIndex] = useState(0);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardRotation = useSharedValue(0);
  const swipeProgress = useSharedValue(0);

  const safeIndex = Math.min(currentIndex, Math.max(savedCards.length - 1, 0));
  const frontCard = savedCards[safeIndex] ?? null;
  const backCard = savedCards.length > 1 ? savedCards[(safeIndex + 1) % savedCards.length] : null;

  const cardBackColor = useSharedValue(themeColors.cardBack);
  const cardColor = useSharedValue(themeColors.card);
  useEffect(() => {
    cardBackColor.value = themeColors.cardBack;
    cardColor.value = themeColors.card;
  }, [themeColors.cardBack, themeColors.card]);

  const handleRemove = useCallback(() => {
    if (!frontCard) return;
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (savedCards.length <= 1) {
      removeSavedCard(frontCard.question);
      router.back();
      return;
    }
    const question = frontCard.question;
    if (safeIndex >= savedCards.length - 1) {
      setCurrentIndex(safeIndex - 1);
    }
    removeSavedCard(question);
  }, [frontCard, savedCards.length, safeIndex, hapticsEnabled, removeSavedCard]);

  // Same advanceCard pattern as icebreakers — receives index from worklet
  const advanceCard = useCallback((index: number) => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const next = index + 1;
    const len = useIcebreakerStore.getState().savedCards.length;
    // Wrap around if at end
    setCurrentIndex(next >= len ? 0 : next);

    // Reset all values AFTER React commits the new render
    requestAnimationFrame(() => {
      translateX.value = 0;
      translateY.value = 0;
      cardRotation.value = 0;
      swipeProgress.value = 0;
    });
  }, [hapticsEnabled, translateX, translateY, cardRotation, swipeProgress]);

  const canSwipe = savedCards.length > 1;

  // Same pan gesture as icebreakers
  const panGesture = Gesture.Pan()
    .enabled(canSwipe)
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.15;
      cardRotation.value = interpolate(e.translationX, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [-15, 0, 15]);
      swipeProgress.value = Math.min(Math.abs(e.translationX) / (SCREEN_WIDTH * 0.75), 1);
    })
    .onEnd((e) => {
      const shouldSwipe =
        Math.abs(e.translationX) > SWIPE_THRESHOLD ||
        Math.abs(e.velocityX) > SWIPE_VELOCITY;

      if (shouldSwipe) {
        const dir = e.translationX > 0 ? 1 : -1;
        swipeProgress.value = withSpring(1, { damping: 12, stiffness: 180, mass: 0.8 });
        translateX.value = withTiming(dir * SCREEN_WIDTH * 1.4, { duration: 400 }, (done) => {
          if (done) runOnJS(advanceCard)(safeIndex);
        });
        cardRotation.value = withTiming(dir * 20, { duration: 400 });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
        cardRotation.value = withSpring(0, { damping: 20, stiffness: 300 });
        swipeProgress.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  // Same animated styles as icebreakers
  const frontCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${cardRotation.value}deg` },
    ],
  }));

  const backCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(swipeProgress.value, [0, 1], [0.85, 1]) }],
    backgroundColor: interpolateColor(swipeProgress.value, [0, 1], [cardBackColor.value, cardColor.value]),
  }));

  if (savedCards.length === 0) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1, backgroundColor: themeColors.background, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 16, color: 'rgba(0,0,0,0.4)' }}>No saved cards</Text>
        </View>
      </>
    );
  }

  const cardStyle = {
    borderRadius: 24,
    padding: 24,
    position: 'absolute' as const,
    top: 0, left: 0, right: 0, bottom: 0,
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: themeColors.background }}>
        <View style={{ flex: 1, paddingTop: insets.top + 12, paddingBottom: insets.bottom, paddingHorizontal: 30 }}>

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 42, height: 42, borderRadius: 21,
                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronLeft size={20} color={themeColors.backgroundDark} strokeWidth={3} />
            </Pressable>

            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: 'rgba(0,0,0,0.3)', letterSpacing: -0.3 }}>
              {safeIndex + 1} of {savedCards.length}
            </Text>

            <Pressable
              onPress={handleRemove}
              style={{
                width: 42, height: 42, borderRadius: 21,
                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Bookmark size={20} color={themeColors.backgroundDark} strokeWidth={2.5} fill={themeColors.backgroundDark} />
            </Pressable>
          </View>

          {/* Card stack — same structure as icebreakers */}
          <View style={{ flex: 1 }}>
            {/* Back card */}
            {backCard ? (
              <Animated.View key={`back-${safeIndex}`} style={[cardStyle, backCardStyle]}>
                <CardContent icebreaker={backCard} isfront={false} />
              </Animated.View>
            ) : null}

            {/* Front card */}
            {frontCard ? (
              <GestureDetector gesture={panGesture}>
                <Animated.View key={`front-${safeIndex}`} style={[cardStyle, { backgroundColor: themeColors.card, zIndex: 2 }, frontCardStyle]}>
                  <CardContent icebreaker={frontCard} isfront={true} />
                </Animated.View>
              </GestureDetector>
            ) : null}
          </View>
        </View>
      </View>
    </>
  );
}
