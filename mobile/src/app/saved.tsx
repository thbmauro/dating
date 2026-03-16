import { useState, useCallback } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useSettingsStore, { THEME_COLORS } from '@/lib/state/settings-store';
import useIcebreakerStore from '@/lib/state/icebreaker-store';
import { ChevronLeft, Bookmark } from 'lucide-react-native';
import { useFonts, Inter_700Bold, Inter_500Medium } from '@expo-google-fonts/inter';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const themeColors = THEME_COLORS['neutral'];
  const savedCards = useIcebreakerStore((s) => s.savedCards);
  const removeSavedCard = useIcebreakerStore((s) => s.removeSavedCard);

  const [fontsLoaded] = useFonts({ Inter_700Bold, Inter_500Medium });

  const [currentIndex, setCurrentIndex] = useState(0);

  const translateX = useSharedValue(0);
  const cardRotation = useSharedValue(0);
  const swipeProgress = useSharedValue(0);

  const safeIndex = Math.min(currentIndex, savedCards.length - 1);
  const currentCard = savedCards[safeIndex] ?? null;
  const nextCard = savedCards[safeIndex + 1] ?? null;

  const handleRemove = useCallback(() => {
    if (!currentCard) return;
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (savedCards.length <= 1) {
      removeSavedCard(currentCard.question);
      router.back();
      return;
    }
    const question = currentCard.question;
    if (safeIndex >= savedCards.length - 1) {
      setCurrentIndex(safeIndex - 1);
    }
    removeSavedCard(question);
  }, [currentCard, savedCards.length, safeIndex, hapticsEnabled, removeSavedCard]);

  const goNext = useCallback(() => {
    if (safeIndex < savedCards.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [safeIndex, savedCards.length]);

  const goPrev = useCallback(() => {
    if (safeIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [safeIndex]);

  const canSwipe = savedCards.length > 1;

  const panGesture = Gesture.Pan()
    .enabled(canSwipe)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      cardRotation.value = e.translationX / 20;
      swipeProgress.value = Math.min(Math.abs(e.translationX) / SWIPE_THRESHOLD, 1);
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD || e.velocityX > 600) {
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 200 }, () => {
          runOnJS(goPrev)();
          translateX.value = 0;
          cardRotation.value = 0;
          swipeProgress.value = 0;
        });
      } else if (e.translationX < -SWIPE_THRESHOLD || e.velocityX < -600) {
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 }, () => {
          runOnJS(goNext)();
          translateX.value = 0;
          cardRotation.value = 0;
          swipeProgress.value = 0;
        });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        cardRotation.value = withSpring(0, { damping: 20, stiffness: 200 });
        swipeProgress.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const frontCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${cardRotation.value}deg` },
    ],
  }));

  const backCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(swipeProgress.value, [0, 1], [0.85, 1]) }],
  }));

  if (!fontsLoaded || savedCards.length === 0) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1, backgroundColor: themeColors.background, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 16, color: 'rgba(0,0,0,0.4)' }}>No saved cards</Text>
        </View>
      </>
    );
  }

  const categoryTitle = currentCard ? currentCard.category.charAt(0).toUpperCase() + currentCard.category.slice(1) : '';

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

          {/* Header: back button + counter + bookmark */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronLeft size={20} color={themeColors.backgroundDark} strokeWidth={3} />
            </Pressable>

            {/* Counter */}
            <Text style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 14,
              color: 'rgba(0,0,0,0.3)',
              letterSpacing: -0.3,
            }}>
              {safeIndex + 1} of {savedCards.length}
            </Text>

            {/* Bookmark - tap to unsave */}
            <Pressable
              onPress={handleRemove}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bookmark size={20} color={themeColors.backgroundDark} strokeWidth={2.5} fill={themeColors.backgroundDark} />
            </Pressable>
          </View>

          {/* Card area */}
          <View style={{ flex: 1 }}>
            {/* Back card - same style as icebreakers */}
            {nextCard ? (
              <Animated.View style={[cardStyle, { backgroundColor: themeColors.cardBack }, backCardStyle]}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: 'Inter_700Bold',
                    fontSize: 24,
                    color: '#000000',
                    letterSpacing: -0.5,
                    lineHeight: 36,
                    opacity: 0,
                  }}>
                    {nextCard.question}
                  </Text>
                  <View style={{ flex: 1 }} />
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: 'rgba(26,26,26,0.3)', letterSpacing: -0.5 }}>
                    {nextCard.category.charAt(0).toUpperCase() + nextCard.category.slice(1)}
                  </Text>
                </View>
              </Animated.View>
            ) : null}

            {/* Front card - same style as icebreakers */}
            {currentCard ? (
              <GestureDetector gesture={panGesture}>
                <Animated.View style={[cardStyle, { backgroundColor: themeColors.card, zIndex: 2 }, frontCardStyle]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontFamily: 'Inter_700Bold',
                      fontSize: 24,
                      color: '#000000',
                      letterSpacing: -0.5,
                      lineHeight: 36,
                    }}>
                      {currentCard.question}
                    </Text>
                    <View style={{ flex: 1 }} />
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: 'rgba(26,26,26,0.3)', letterSpacing: -0.5 }}>
                      {categoryTitle}
                    </Text>
                  </View>
                </Animated.View>
              </GestureDetector>
            ) : null}
          </View>
        </View>
      </View>
    </>
  );
}
