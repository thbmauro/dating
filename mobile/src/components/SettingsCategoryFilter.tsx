import React, { useCallback, useState, useRef } from 'react';
import { View, Text, Pressable, Dimensions, Switch, Linking, TextInput, ScrollView } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import useIcebreakerStore, { CATEGORIES, CategoryType } from '@/lib/state/icebreaker-store';
import useSettingsStore, { ColorTheme } from '@/lib/state/settings-store';
import Svg, { Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { X, Settings, ChevronLeft, User } from 'lucide-react-native';

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const SCREEN_WIDTH = Dimensions.get('window').width;

// 9 circles evenly distributed around the heart center (40° apart, starting from top)
const ORBIT_RADIUS = 135;
const SCATTERED_POSITIONS: { x: number; y: number }[] = Array.from({ length: 9 }, (_, i) => {
  const angle = (i * (360 / 9) - 90) * (Math.PI / 180); // start from top (-90°)
  return {
    x: Math.round(Math.cos(angle) * ORBIT_RADIUS),
    y: Math.round(Math.sin(angle) * ORBIT_RADIUS),
  };
});

const CIRCLE_AREA_WIDTH = SCREEN_WIDTH - 60;
const CIRCLE_AREA_HEIGHT = 220;
const HEART_SIZE = 40;
const CIRCLE_SIZE = 76;
const SNAP_THRESHOLD = 60;
const EMOJI_BLOCK_OFFSET = -20;
const HOVER_THRESHOLD = 52;

interface AnimatedCategoryCircleProps {
  emoji: string;
  isSelected: boolean;
  isHovered: boolean;
  x: number;
  y: number;
}

function AnimatedCategoryCircle({ emoji, isSelected, isHovered, x, y }: AnimatedCategoryCircleProps) {
  const scale = useSharedValue(1);
  const bounceY = useSharedValue(0);
  const wasHovered = useSharedValue(false);

  React.useEffect(() => {
    if (isHovered && !isSelected && !wasHovered.value) {
      wasHovered.value = true;
      scale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 400 }),
        withSpring(1.1, { damping: 10, stiffness: 300 })
      );
      bounceY.value = withSequence(
        withSpring(-8, { damping: 8, stiffness: 400 }),
        withSpring(0, { damping: 10, stiffness: 300 })
      );
    } else if (!isHovered) {
      wasHovered.value = false;
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      bounceY.value = withSpring(0, { damping: 15, stiffness: 200 });
    }
  }, [isHovered, isSelected, scale, bounceY, wasHovered]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounceY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x - CIRCLE_SIZE / 2,
          top: y - CIRCLE_SIZE / 2,
          width: CIRCLE_SIZE,
          height: CIRCLE_SIZE,
          borderRadius: CIRCLE_SIZE / 2,
          backgroundColor: isSelected ? '#ECEAE7' : 'rgba(255, 255, 255, 0.05)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
      ]}
    >
      <Text style={{ fontSize: 32 }}>{emoji}</Text>
    </Animated.View>
  );
}

function capitalizeCategory(cat: string): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

interface SettingsCategoryFilterProps {
  onSelect?: () => void;
  onDismiss?: () => void;
}

// Settings panel component
function SettingsPanel({ onBack }: { onBack: () => void }) {
  const colorTheme = useSettingsStore((s) => s.colorTheme);
  const setColorTheme = useSettingsStore((s) => s.setColorTheme);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);
  const player1Name = useSettingsStore((s) => s.player1Name);
  const player2Name = useSettingsStore((s) => s.player2Name);
  const setPlayer1Name = useSettingsStore((s) => s.setPlayer1Name);
  const setPlayer2Name = useSettingsStore((s) => s.setPlayer2Name);

  const handleColorSelect = useCallback((theme: ColorTheme) => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setColorTheme(theme);
  }, [hapticsEnabled, setColorTheme]);

  const handleHapticsToggle = useCallback((value: boolean) => {
    // Always trigger haptic when turning ON
    if (value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setHapticsEnabled(value);
  }, [setHapticsEnabled]);

  const handleOpenLink = useCallback((url: string) => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL(url);
  }, [hapticsEnabled]);

  const scrollViewRef = useRef<ScrollView>(null);

  // Single representative color for each palette
  const colorOptions: { theme: ColorTheme; label: string; color: string }[] = [
    { theme: 'warm', label: 'Warm', color: '#F5CB5C' },
    { theme: 'cool', label: 'Cool', color: '#A7ACD9' },
    { theme: 'neutral', label: 'Neutral', color: '#9E9E9E' },
  ];

  return (
    <ScrollView
      ref={scrollViewRef}
      style={{ flex: 1, paddingHorizontal: 24 }}
      contentContainerStyle={{ flexGrow: 1, paddingTop: 24, paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={false}
      automaticallyAdjustKeyboardInsets={true}
    >
      {/* Header with back button on left */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 4 }}>
        <Pressable
          onPress={() => {
            if (hapticsEnabled) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            onBack();
          }}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <ChevronLeft size={20} color="#FFFFFF" strokeWidth={3} />
        </Pressable>
        <Text
          style={{
            fontFamily: 'Inter_700Bold',
            fontSize: 24,
            color: 'rgba(236, 234, 231, 0.7)',
            letterSpacing: -0.5,
            lineHeight: 32,
          }}
        >
          Settings
        </Text>
      </View>

      {/* Color theme section */}
      <View style={{ marginTop: 24, marginBottom: 32 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {colorOptions.map((option) => (
            <Pressable
              key={option.theme}
              onPress={() => handleColorSelect(option.theme)}
              style={{
                flex: 1,
                aspectRatio: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 16,
                backgroundColor: option.color,
                borderWidth: 3,
                borderColor: colorTheme === option.theme ? '#FFFFFF' : 'transparent',
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter_700Bold',
                  fontSize: 16,
                  color: '#000000',
                  letterSpacing: -0.3,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Haptic feedback toggle */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 16,
          paddingHorizontal: 20,
          marginBottom: 32,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
        }}
      >
        <Text
          style={{
            fontFamily: 'Inter_700Bold',
            fontSize: 16,
            color: '#FFFFFF',
            letterSpacing: -0.3,
          }}
        >
          Haptic Feedback
        </Text>
        <Switch
          value={hapticsEnabled}
          onValueChange={handleHapticsToggle}
          trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: 'rgba(255, 255, 255, 0.4)' }}
          thumbColor={hapticsEnabled ? '#FFFFFF' : '#888888'}
        />
      </View>

      {/* Player names section */}
      <View style={{ gap: 12, marginBottom: 16 }}>
        {/* Player 1 */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={24} color="#000000" strokeWidth={2.5} />
          </View>
          <View
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 14,
            }}
          >
            <TextInput
              value={player1Name}
              onChangeText={(text) => setPlayer1Name(text.slice(0, 14))}
              onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300)}
              placeholder="Add player 1 name"
              placeholderTextColor="rgba(255, 255, 255, 0.2)"
              maxLength={14}
              selectionColor="#FFFFFF"
              cursorColor="#FFFFFF"
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 16,
                color: '#FFFFFF',
                letterSpacing: -0.3,
                padding: 0,
              }}
            />
          </View>
        </View>

        {/* Player 2 */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={24} color="#000000" strokeWidth={2.5} />
          </View>
          <View
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 14,
            }}
          >
            <TextInput
              value={player2Name}
              onChangeText={(text) => setPlayer2Name(text.slice(0, 14))}
              onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300)}
              placeholder="Add player 2 name"
              placeholderTextColor="rgba(255, 255, 255, 0.2)"
              maxLength={14}
              selectionColor="#FFFFFF"
              cursorColor="#FFFFFF"
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 16,
                color: '#FFFFFF',
                letterSpacing: -0.3,
                padding: 0,
              }}
            />
          </View>
        </View>
      </View>

      {/* Spacer to push legal links to bottom */}
      <View style={{ flex: 1 }} />

      {/* Legal links at bottom */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, paddingBottom: 8 }}>
        <Pressable onPress={() => handleOpenLink('https://example.com/privacy')}>
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.4)',
              letterSpacing: -0.2,
            }}
          >
            Privacy Policy
          </Text>
        </Pressable>

        <Pressable onPress={() => handleOpenLink('https://example.com/terms')}>
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 13,
              color: 'rgba(255, 255, 255, 0.4)',
              letterSpacing: -0.2,
            }}
          >
            Terms & Conditions
          </Text>
        </Pressable>
      </View>
      </ScrollView>
  );
}

export default function SettingsCategoryFilter({ onSelect, onDismiss }: SettingsCategoryFilterProps) {
  const selectedCategory = useIcebreakerStore((s) => s.selectedCategory);
  const setSelectedCategory = useIcebreakerStore((s) => s.setSelectedCategory);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);

  // Settings panel state
  const [showSettings, setShowSettings] = useState(false);
  const settingsSlideX = useSharedValue(0);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const dotScale = useSharedValue(1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [innerContainerY, setInnerContainerY] = useState<number>(0);
  const [outerWidth, setOuterWidth] = useState<number>(CIRCLE_AREA_WIDTH);
  const lastHoveredIndex = useSharedValue<number>(-1);
  const hoveredCategory = hoveredIndex !== null ? CATEGORIES[hoveredIndex] : null;

  // Handle settings panel open/close with smooth timing
  const openSettings = useCallback(() => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowSettings(true);
    settingsSlideX.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) });
  }, [hapticsEnabled, settingsSlideX]);

  const closeSettings = useCallback(() => {
    settingsSlideX.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) }, (done) => {
      if (done) {
        runOnJS(setShowSettings)(false);
      }
    });
  }, [settingsSlideX]);

  // Animated styles for the sliding panels - smoother transitions
  const vibeSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(settingsSlideX.value, [0, 1], [0, SCREEN_WIDTH]) }],
    opacity: interpolate(settingsSlideX.value, [0, 1], [1, 0]),
  }));

  const settingsPanelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(settingsSlideX.value, [0, 1], [-SCREEN_WIDTH, 0]) }],
    opacity: interpolate(settingsSlideX.value, [0, 1], [0, 1]),
  }));

  const areaCenterX = CIRCLE_AREA_WIDTH / 2;
  const areaCenterY = CIRCLE_AREA_HEIGHT / 2;

  // Heart sits at the center of the emoji area
  const dotRestX = areaCenterX;
  const dotRestY = areaCenterY + EMOJI_BLOCK_OFFSET;

  const containerHeight = CIRCLE_AREA_HEIGHT + 50; // Increased to fit the heart and line

  // Heart at center — allow dragging in all directions to reach orbit circles
  const maxDrag = ORBIT_RADIUS + 20;
  const maxUpwardDrag = -maxDrag;
  const maxDownwardDrag = maxDrag;

  // Horizontal bounds
  const maxLeftDrag = -maxDrag;
  const maxRightDrag = maxDrag;

  const triggerSelection = useCallback(
    (category: CategoryType) => {
      if (category === selectedCategory) {
        // Already selected - do nothing
        return;
      }
      if (hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setSelectedCategory(category);
      if (onSelect) {
        setTimeout(onSelect, 200);
      }
    },
    [selectedCategory, setSelectedCategory, onSelect, hapticsEnabled]
  );

  const triggerDragStart = useCallback(() => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticsEnabled]);

  const triggerHover = useCallback((index: number) => {
    setHoveredIndex(index);
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticsEnabled]);

  const triggerUnhover = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const dotOffsetY = 0; // heart is at center of emoji area

  const panGesture = Gesture.Pan()
    .onStart(() => {
      dotScale.value = withSpring(1.3, { damping: 15, stiffness: 200 });
      runOnJS(triggerDragStart)();
    })
    .onUpdate((event) => {
      translateX.value = Math.max(maxLeftDrag, Math.min(maxRightDrag, event.translationX));
      translateY.value = Math.max(maxUpwardDrag, Math.min(maxDownwardDrag, event.translationY));

      const absDotX = translateX.value;
      const absDotY = translateY.value;

      let foundHoverIndex = -1;
      for (let i = 0; i < CATEGORIES.length; i++) {
        const pos = SCATTERED_POSITIONS[i];
        if (!pos) continue;

        const dist = Math.sqrt(
          (absDotX - pos.x) ** 2 + (absDotY - pos.y) ** 2
        );

        const isAlreadySelected = CATEGORIES[i]?.value === selectedCategory;

        if (dist < HOVER_THRESHOLD && !isAlreadySelected) {
          foundHoverIndex = i;
          break;
        }
      }

      if (foundHoverIndex !== lastHoveredIndex.value) {
        lastHoveredIndex.value = foundHoverIndex;
        if (foundHoverIndex >= 0) {
          runOnJS(triggerHover)(foundHoverIndex);
        } else {
          runOnJS(triggerUnhover)();
        }
      }
    })
    .onEnd(() => {
      const absDotX = translateX.value;
      const absDotY = translateY.value;

      let closestCategory: CategoryType = null;
      let closestDist = Infinity;

      for (let i = 0; i < CATEGORIES.length; i++) {
        const pos = SCATTERED_POSITIONS[i];
        if (!pos) continue;

        const dist = Math.sqrt(
          (absDotX - pos.x) ** 2 + (absDotY - pos.y) ** 2
        );

        if (dist < closestDist) {
          closestDist = dist;
          closestCategory = CATEGORIES[i]?.value ?? null;
        }
      }

      if (closestDist < SNAP_THRESHOLD && closestCategory) {
        runOnJS(triggerSelection)(closestCategory);
      }

      translateX.value = withSpring(0, { damping: 15, stiffness: 180 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 180 });
      dotScale.value = withSpring(1, { damping: 15, stiffness: 200 });
      lastHoveredIndex.value = -1;
      runOnJS(triggerUnhover)();
    });

  const dotStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: dotScale.value },
    ],
  }));

  const lineProps = useAnimatedProps(() => ({
    x1: dotRestX + translateX.value,
    y1: dotRestY + translateY.value + 100,
    x2: dotRestX,
    y2: dotRestY + 100,
    opacity: interpolate(
      Math.sqrt(translateX.value ** 2 + translateY.value ** 2),
      [0, 10],
      [0, 0.6]
    ),
  }));

  const gradientProps = useAnimatedProps(() => ({
    x1: dotRestX + translateX.value,
    y1: dotRestY + translateY.value + 100,
    x2: dotRestX,
    y2: dotRestY + 100,
  }));

  const displayName = hoveredCategory
    ? capitalizeCategory(hoveredCategory.value || '')
    : selectedCategory
      ? capitalizeCategory(selectedCategory)
      : null;

  return (
    <View
      style={{ flex: 1, backgroundColor: 'transparent', overflow: 'hidden', paddingHorizontal: 24 }}
      onLayout={(e) => setOuterWidth(e.nativeEvent.layout.width)}
    >
      {/* Settings Panel - slides in from left */}
      {showSettings ? (
        <Animated.View
          style={[{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
          }, settingsPanelStyle]}
        >
          <SettingsPanel onBack={closeSettings} />
        </Animated.View>
      ) : null}

      {/* Vibe Panel - slides out to right */}
      <Animated.View style={[{ flex: 1, overflow: 'visible' }, vibeSlideStyle]}>
        {/* Title row + close button */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 28, paddingBottom: 4 }}>
          {/* Title aligned left */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 24,
                color: 'rgba(236, 234, 231, 0.7)',
                letterSpacing: -0.5,
                lineHeight: 32,
              }}
            >
              Pick a Vibe
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 24,
                color: '#FFFFFF',
                letterSpacing: -0.5,
                marginTop: 2,
                height: 32,
              }}
            >
              {displayName || ''}
            </Text>
          </View>

          {/* X close button - only show if a category is already selected */}
          {selectedCategory !== null ? (
            <Pressable
              onPress={() => {
                if (hapticsEnabled) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onDismiss?.();
              }}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 2,
              }}
            >
              <X size={20} color="#FFFFFF" strokeWidth={3} />
            </Pressable>
          ) : null}
        </View>

      {/* Emoji circles + heart */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        }}
      >
        <View
          style={{
            width: CIRCLE_AREA_WIDTH,
            height: containerHeight,
            overflow: 'visible',
          }}
          onLayout={(e) => setInnerContainerY(e.nativeEvent.layout.y)}
        >
          {/* Category emoji circles - scattered */}
          {CATEGORIES.map((cat, i) => {
            const pos = SCATTERED_POSITIONS[i];
            if (!pos) return null;

            const x = areaCenterX + pos.x;
            const y = areaCenterY + pos.y + EMOJI_BLOCK_OFFSET;

            const isSelected = selectedCategory === cat.value;
            const isHovered = hoveredIndex === i;

            return (
              <AnimatedCategoryCircle
                key={cat.value}
                emoji={cat.emoji}
                isSelected={isSelected}
                isHovered={isHovered}
                x={x}
                y={y}
              />
            );
          })}

          {/* SVG Line - removed from here, placed outside clipping container */}

          {/* Draggable heart */}
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  left: dotRestX - HEART_SIZE / 2,
                  top: dotRestY - HEART_SIZE / 2,
                  zIndex: 10,
                },
                dotStyle,
              ]}
            >
              <Text style={{ fontSize: HEART_SIZE, lineHeight: HEART_SIZE + 4 }}>
                ❤️
              </Text>
            </Animated.View>
          </GestureDetector>
        </View>

        {/* SVG Line - absolute overlay on the flex:1 wrapper */}
        <Svg
          width={CIRCLE_AREA_WIDTH}
          height={containerHeight + 200}
          style={{ position: 'absolute', left: (outerWidth - CIRCLE_AREA_WIDTH) / 2 - 24, top: innerContainerY - 100 }}
          pointerEvents="none"
        >
          <Defs>
            <AnimatedLinearGradient
              id="lineGradient"
              gradientUnits="userSpaceOnUse"
              animatedProps={gradientProps}
            >
              <Stop offset="0" stopColor="#E57373" stopOpacity="1" />
              <Stop offset="1" stopColor="#141414" stopOpacity="1" />
            </AnimatedLinearGradient>
          </Defs>
          <AnimatedLine animatedProps={lineProps} stroke="url(#lineGradient)" strokeWidth={4} />
        </Svg>
      </View>

      {/* Bottom: subtitle + Settings button */}
      <View style={{ alignItems: 'center', paddingBottom: 14, marginTop: -60 }}>
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 14,
            color: 'rgba(154, 151, 144, 0.5)',
            letterSpacing: -0.3,
            marginTop: -20,
          }}
        >
          Drop the heart on a topic
        </Text>

        {/* Settings button - below tooltip */}
        <Pressable
          onPress={openSettings}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 35,
            paddingVertical: 10,
            paddingHorizontal: 16,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 20,
          }}
        >
          <Settings size={18} color="rgba(255, 255, 255, 0.5)" strokeWidth={2.5} />
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 14,
              color: '#FFFFFF',
              letterSpacing: -0.3,
            }}
          >
            Settings
          </Text>
        </Pressable>
      </View>
      </Animated.View>
    </View>
  );
}
