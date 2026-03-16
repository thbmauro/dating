import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View, Pressable, AppState, Share, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { api } from '@/lib/api/api';
import useIcebreakerStore, { Icebreaker, CATEGORIES, CategoryType } from '@/lib/state/icebreaker-store';
import useSettingsStore, { THEME_COLORS } from '@/lib/state/settings-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  runOnJS,
  interpolate,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SlidersHorizontal, Share2, Bookmark, User, Check, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { useFonts, Inter_700Bold, Inter_500Medium } from '@expo-google-fonts/inter';
import CategoryFilter from '@/components/CategoryFilter';
import SettingsCategoryFilter from '@/components/SettingsCategoryFilter';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const SWIPE_VELOCITY = 600;
const BATCH_SIZE = 10;
const REFETCH_THRESHOLD = 3;

type TabType = 'icebreakers' | 'compatibility';

interface CompatibilityQuestion {
  question: string;
  category: string;
  emoji: string;
  answers: string[];
}

interface CompatibilityResponse {
  category: string;
  emoji: string;
  questions: CompatibilityQuestion[];
}

interface AnswerRecord {
  person1: number;
  person2: number;
}

async function fetchBatch(category: CategoryType, count = BATCH_SIZE): Promise<Icebreaker[]> {
  const param = category != null ? `?category=${encodeURIComponent(category)}` : '';
  return Promise.all(
    Array.from({ length: count }, () => api.get<Icebreaker>(`/api/icebreakers/random${param}`))
  );
}

async function fetchCompatibilityQuestions(category: CategoryType): Promise<CompatibilityQuestion[]> {
  const param = category != null ? `?category=${encodeURIComponent(category)}` : '';
  const response = await api.get<CompatibilityResponse>(`/api/icebreakers/compatibility${param}`);
  return response.questions;
}

function AnimatedWord({ word, index, trigger, darkMode = false }: { word: string; index: number; trigger: boolean; darkMode?: boolean }) {
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
    <Animated.Text style={[animStyle, { color: darkMode ? '#FFFFFF' : '#000000', fontSize: 24, lineHeight: 36, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 }]}>
      {word}{' '}
    </Animated.Text>
  );
}

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
      {/* Category always visible on both front and back card */}
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: 'rgba(26,26,26,0.3)', letterSpacing: -0.5 }}>
        {categoryTitle}
      </Text>
    </View>
  );
}

interface CompatibilityCardContentProps {
  question: CompatibilityQuestion;
  isfront: boolean;
  questionNumber: number;
  totalQuestions: number;
  currentPerson: 1 | 2;
  person1Answer: number | null;
  person2Answer: number | null;
  onAnswer: (answerIndex: number) => void;
  selectedCategory: string | null;
}

// Animated answer button with flash effect
function AnswerButton({ answer, index, onPress, disabled }: { answer: string; index: number; onPress: (index: number) => void; disabled?: boolean }) {
  const scale = useSharedValue(1);
  const bgOpacity = useSharedValue(0.1);

  const handlePress = useCallback(() => {
    if (disabled) return;
    // Flash effect - brighten and scale
    bgOpacity.value = withSequence(
      withTiming(0.5, { duration: 100 }),
      withTiming(0.1, { duration: 200 })
    );
    scale.value = withSequence(
      withTiming(0.96, { duration: 80 }),
      withTiming(1, { duration: 150 })
    );
    onPress(index);
  }, [index, onPress, bgOpacity, scale, disabled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: `rgba(255,255,255,${bgOpacity.value})`,
  }));

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <Animated.View
        style={[{
          paddingVertical: 14,
          paddingHorizontal: 18,
          borderRadius: 16,
          opacity: disabled ? 0.4 : 1,
        }, animatedStyle]}
      >
        <Text style={{
          fontFamily: 'Inter_700Bold',
          fontSize: 15,
          color: '#FFFFFF',
          textAlign: 'center',
          letterSpacing: -0.3,
        }}>
          {answer}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function CompatibilityCardContent({
  question,
  isfront,
  questionNumber,
  totalQuestions,
  currentPerson,
  person1Answer,
  person2Answer,
  onAnswer,
  selectedCategory,
}: CompatibilityCardContentProps) {
  const words = question.question.split(' ');
  // Use the selected category from the filter, or show nothing if no filter is selected
  const categoryTitle = selectedCategory
    ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)
    : '';

  return (
    <View style={{ flex: 1 }}>
      {/* Top row: Category on left, Progress on right */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: 'rgba(255,255,255,0.3)', letterSpacing: -0.5 }}>
          {categoryTitle}
        </Text>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: 'rgba(255,255,255,0.3)', letterSpacing: -0.5 }}>
          {questionNumber} of {totalQuestions}
        </Text>
      </View>

      {/* Question text */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {words.map((word, i) => (
          <AnimatedWord key={`${i}-${word}`} word={word} index={i} trigger={isfront} darkMode={true} />
        ))}
      </View>

      <View style={{ flex: 1 }} />

      {/* Answer buttons at bottom - dynamic based on answers array */}
      <View style={{ gap: 10 }}>
        {question.answers.map((answer, index) => (
          <AnswerButton
            key={index}
            answer={answer}
            index={index}
            onPress={onAnswer}
            disabled={person2Answer !== null}
          />
        ))}
      </View>
    </View>
  );
}

interface CompatibilityResultsProps {
  answerHistory: AnswerRecord[];
  totalQuestions: number;
  questions: CompatibilityQuestion[];
  onOpenDetails: () => void;
  onPlayAgain: () => void;
  animate?: boolean;
  themeColors: typeof THEME_COLORS['neutral'];
  player1Name: string;
  player2Name: string;
}

// Counting animation component - counts from 0 to target number
function ScrambleText({ targetValue, onComplete }: { targetValue: number; onComplete?: () => void }) {
  // CRITICAL: Initialize to 0, not null - this ensures we ALWAYS show 0 first
  const [displayValue, setDisplayValue] = useState(0);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Only run once per mount
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    let current = 0;
    const step = Math.max(1, Math.ceil(targetValue / 25));

    // Start counting immediately
    const tick = () => {
      current = Math.min(current + step, targetValue);
      setDisplayValue(current);
      if (current < targetValue) {
        setTimeout(tick, 30);
      } else {
        // Animation complete
        onComplete?.();
      }
    };

    // Start right away
    tick();
  }, [targetValue, onComplete]);

  return (
    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 96, color: '#FFFFFF', letterSpacing: -4 }}>
      {displayValue}%
    </Text>
  );
}

// Static display for behind the card (shows 0% to avoid spoiling the result)
function StaticPercentText() {
  return (
    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 96, color: '#FFFFFF', letterSpacing: -4 }}>
      0%
    </Text>
  );
}

function CompatibilityResults({ answerHistory, totalQuestions, questions, onOpenDetails, onPlayAgain, animate = true, themeColors, player1Name, player2Name }: CompatibilityResultsProps) {
  // Calculate compatibility score: percentage of matching answers
  const matchingAnswers = answerHistory.filter(record => record.person1 === record.person2).length;
  const actualTotal = answerHistory.length > 0 ? answerHistory.length : totalQuestions;
  const compatibilityPercent = answerHistory.length > 0
    ? Math.round((matchingAnswers / actualTotal) * 100)
    : 0;

  // Build header text based on player names
  const hasNames = player1Name && player2Name;
  const headerText = hasNames
    ? `${player1Name} & ${player2Name}\nCompatibility Results`
    : 'Your compatibility result';

  // Get message based on score - use fixed strings to prevent layout shift
  const message = compatibilityPercent >= 80 ? "You two are soulmates!" :
                  compatibilityPercent >= 60 ? "Great connection!" :
                  compatibilityPercent >= 40 ? "Some common ground" :
                  compatibilityPercent >= 20 ? "Opposites attract?" :
                  "Very different perspectives";

  // Haptic feedback when count completes
  const handleCountComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: 'rgba(255,255,255,0.5)', marginBottom: 8, letterSpacing: -0.5, textAlign: 'center' }}>
        {headerText}
      </Text>
      <View style={{ width: 300, height: 110, alignItems: 'center', justifyContent: 'center' }}>
        {animate ? (
          <ScrambleText targetValue={compatibilityPercent} onComplete={handleCountComplete} />
        ) : (
          <StaticPercentText />
        )}
      </View>
      <View style={{ width: 300, height: 30, alignItems: 'center', justifyContent: 'center', marginTop: 30 }}>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#FFFFFF', textAlign: 'center', letterSpacing: -0.5 }}>
          {message}
        </Text>
      </View>
      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8, textAlign: 'center' }}>
        {matchingAnswers} of {actualTotal} answers matched
      </Text>

      <Pressable
        onPress={onOpenDetails}
        style={{
          marginTop: 32,
          backgroundColor: '#FFFFFF',
          paddingVertical: 16,
          paddingHorizontal: 32,
          borderRadius: 16,
        }}
        className="active:opacity-80"
      >
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: themeColors.backgroundDark, letterSpacing: -0.3 }}>
          See details
        </Text>
      </Pressable>

      <Pressable
        onPress={onPlayAgain}
        style={{
          marginTop: 12,
          backgroundColor: themeColors.cardDark,
          paddingVertical: 16,
          paddingHorizontal: 32,
          borderRadius: 16,
        }}
        className="active:opacity-80"
      >
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#FFFFFF', letterSpacing: -0.3 }}>
          Play again
        </Text>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const selectedCategory = useIcebreakerStore((s) => s.selectedCategory);
  const setCachedIcebreaker = useIcebreakerStore((s) => s.setCachedIcebreaker);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const colorTheme = useSettingsStore((s) => s.colorTheme);
  const themeColors = THEME_COLORS[colorTheme];
  const player1Name = useSettingsStore((s) => s.player1Name);
  const player2Name = useSettingsStore((s) => s.player2Name);
  const [filterOpen, setFilterOpen] = useState(true);
  const [showSettingsFilter, setShowSettingsFilter] = useState(false);
  const [cards, setCards] = useState<Icebreaker[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const isFetchingRef = useRef(false);
  const [activeTab, setActiveTab] = useState<TabType>('icebreakers');
  // Track if user has just selected their first vibe this session (for showing nudge)
  const hasSelectedVibeThisSession = useRef(false);

  // Compatibility-specific state
  const [compatibilityCards, setCompatibilityCards] = useState<CompatibilityQuestion[]>([]);
  const [compatibilityIndex, setCompatibilityIndex] = useState(0);
  // Track which person is answering (1 or 2) and their answers
  const [currentPerson, setCurrentPerson] = useState<1 | 2>(1);
  const [person1Answer, setPerson1Answer] = useState<number | null>(null);
  const [person2Answer, setPerson2Answer] = useState<number | null>(null);
  // Track all answers for final compatibility score
  const [answerHistory, setAnswerHistory] = useState<AnswerRecord[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [fontsLoaded] = useFonts({ Inter_700Bold, Inter_500Medium });

  // Swipe animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardRotation = useSharedValue(0);
  // swipeProgress (0→1) drives back card scale and color as front card is dragged
  const swipeProgress = useSharedValue(0);
  // Tab switch bounce animation
  const tabSwitchScale = useSharedValue(1);

  const loadInitialBatch = useCallback(async (category: CategoryType) => {
    setIsLoading(true);
    setIsError(false);
    setCards([]);
    setCurrentIndex(0);
    translateX.value = 0;
    translateY.value = 0;
    cardRotation.value = 0;
    swipeProgress.value = 0;
    try {
      const batch = await fetchBatch(category);
      setCards(batch);
      if (batch.length > 0) setCachedIcebreaker(batch[0], `session-${Date.now()}`);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [setCachedIcebreaker, translateX, translateY, cardRotation, swipeProgress]);

  const fetchMoreCards = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const batch = await fetchBatch(selectedCategory);
      setCards((prev) => [...prev, ...batch]);
    } catch {
      // silent
    } finally {
      isFetchingRef.current = false;
    }
  }, [selectedCategory]);

  // Only load icebreakers when a category is selected
  useEffect(() => {
    if (selectedCategory !== null) {
      loadInitialBatch(selectedCategory);
    }
  }, [selectedCategory, loadInitialBatch]);

  // Load compatibility cards from API when category changes
  const [compatibilityLoading, setCompatibilityLoading] = useState(false);
  const loadCompatibilityQuestions = useCallback(async (category: CategoryType) => {
    if (category === null) return; // Don't load if no category selected
    setCompatibilityLoading(true);
    setCompatibilityIndex(0);
    setCurrentPerson(1);
    setPerson1Answer(null);
    setPerson2Answer(null);
    setAnswerHistory([]);
    setShowResults(false);
    try {
      const questions = await fetchCompatibilityQuestions(category);
      setCompatibilityCards(questions);
    } catch {
      // Keep existing cards on error
    } finally {
      setCompatibilityLoading(false);
    }
  }, []);

  // Load compatibility questions when category changes or on initial load
  useEffect(() => {
    if (selectedCategory !== null) {
      loadCompatibilityQuestions(selectedCategory);
    }
  }, [selectedCategory, loadCompatibilityQuestions]);

  useEffect(() => {
    if ((cards.length > 0 || isError) && fontsLoaded) SplashScreen.hideAsync();
  }, [cards, isError, fontsLoaded]);

  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { appState.current = s; });
    return () => sub.remove();
  }, []);

  const pulseOpacity = useSharedValue(0.3);
  useEffect(() => {
    if (isLoading) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ), -1, false
      );
    }
  }, [isLoading, pulseOpacity]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  const advanceCard = useCallback((index: number) => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const next = index + 1;

    if (activeTab === 'icebreakers') {
      // Advance the index — old front card unmounts while still at SCREEN_WIDTH*1.4 (off-screen, invisible)
      setCurrentIndex(next);
      if (cards[next]) setCachedIcebreaker(cards[next], `session-${Date.now()}`);
      if (cards.length - next < REFETCH_THRESHOLD) fetchMoreCards();
    } else {
      // For compatibility, loop back if we reach the end
      const nextCompat = next >= compatibilityCards.length ? 0 : next;
      setCompatibilityIndex(nextCompat);
      // Reset answers for next question
      setCurrentPerson(1);
      setPerson1Answer(null);
      setPerson2Answer(null);
    }

    // Reset all values AFTER React commits the new render so the new card is already mounted at 0
    requestAnimationFrame(() => {
      translateX.value = 0;
      translateY.value = 0;
      cardRotation.value = 0;
      swipeProgress.value = 0;
    });
  }, [cards, compatibilityCards, activeTab, setCachedIcebreaker, fetchMoreCards, translateX, translateY, cardRotation, swipeProgress]);

  // Handle compatibility answer
  const handleCompatibilityAnswer = useCallback((answerIndex: number) => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentPerson === 1) {
      setPerson1Answer(answerIndex);
      setCurrentPerson(2);
    } else {
      setPerson2Answer(answerIndex);
      // Record the answer pair
      const newRecord: AnswerRecord = { person1: person1Answer!, person2: answerIndex };
      const newHistory = [...answerHistory, newRecord];
      setAnswerHistory(newHistory);

      const isLastQuestion = compatibilityIndex === compatibilityCards.length - 1;

      // Both answered - auto swipe after a brief delay
      setTimeout(() => {
        // Trigger auto-swipe animation
        swipeProgress.value = withSpring(1, { damping: 12, stiffness: 180, mass: 0.8 });
        translateX.value = withTiming(SCREEN_WIDTH * 1.4, { duration: 400 }, (done) => {
          if (done) {
            if (isLastQuestion) {
              // Show results screen
              runOnJS(setShowResults)(true);
            } else {
              runOnJS(advanceCard)(compatibilityIndex);
            }
          }
        });
        cardRotation.value = withTiming(15, { duration: 400 });
      }, 500);
    }
  }, [currentPerson, person1Answer, compatibilityIndex, compatibilityCards.length, answerHistory, advanceCard, swipeProgress, translateX, cardRotation]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.15;
      cardRotation.value = interpolate(e.translationX, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [-15, 0, 15]);
      // Scale based on full screen width so back card reaches 100% only when card is near off-screen
      swipeProgress.value = Math.min(Math.abs(e.translationX) / (SCREEN_WIDTH * 0.75), 1);
    })
    .onEnd((e) => {
      const shouldSwipe =
        Math.abs(e.translationX) > SWIPE_THRESHOLD ||
        Math.abs(e.velocityX) > SWIPE_VELOCITY;

      if (shouldSwipe) {
        const dir = e.translationX > 0 ? 1 : -1;
        const idx = activeTab === 'icebreakers' ? currentIndex : compatibilityIndex;
        swipeProgress.value = withSpring(1, { damping: 12, stiffness: 180, mass: 0.8 });
        translateX.value = withTiming(dir * SCREEN_WIDTH * 1.4, { duration: 400 }, (done) => {
          if (done) runOnJS(advanceCard)(idx);
        });
        cardRotation.value = withTiming(dir * 20, { duration: 400 });
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
        cardRotation.value = withSpring(0, { damping: 20, stiffness: 300 });
        swipeProgress.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  // Front card: translates and rotates
  const frontCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${cardRotation.value}deg` },
    ],
  }));

  // Track theme colors as shared values so interpolateColor updates reactively
  const cardBackColor = useSharedValue(themeColors.cardBack);
  const cardColor = useSharedValue(themeColors.card);
  useEffect(() => {
    cardBackColor.value = themeColors.cardBack;
    cardColor.value = themeColors.card;
  }, [themeColors.cardBack, themeColors.card]);

  // Back card: scale 0.85→1 and color cardBack→card driven by swipeProgress
  const backCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(swipeProgress.value, [0, 1], [0.85, 1]) }],
    backgroundColor: interpolateColor(swipeProgress.value, [0, 1], [cardBackColor.value, cardColor.value]),
  }));

  // Dark mode back card for compatibility: scale 0.85→1, no color change
  const backCardStyleDark = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(swipeProgress.value, [0, 1], [0.85, 1]) }],
  }));

  // Reset compatibility game
  const handlePlayAgain = useCallback(() => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowResults(false);
    setCompatibilityIndex(0);
    setCurrentPerson(1);
    setPerson1Answer(null);
    setPerson2Answer(null);
    setAnswerHistory([]);
    translateX.value = 0;
    translateY.value = 0;
    cardRotation.value = 0;
    swipeProgress.value = 0;
  }, [translateX, translateY, cardRotation, swipeProgress]);

  // Nudge animation - double bounce + rotation after 5 seconds of inactivity
  const nudgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerNudge = useCallback(() => {
    // Single nudge to the right with rotation - moves 60px to reveal card behind
    translateX.value = withSequence(
      withTiming(60, { duration: 300, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) })
    );
    cardRotation.value = withSequence(
      withTiming(5, { duration: 300, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) })
    );
  }, [translateX, cardRotation]);

  const resetNudgeTimer = useCallback(() => {
    if (nudgeTimeoutRef.current) {
      clearTimeout(nudgeTimeoutRef.current);
    }
    // Only nudge on the first card after user has selected a vibe this session
    if (activeTab === 'icebreakers' && !isLoading && cards.length > 0 && currentIndex === 0 && hasSelectedVibeThisSession.current && !filterOpen) {
      nudgeTimeoutRef.current = setTimeout(triggerNudge, 5000);
    }
  }, [activeTab, isLoading, cards.length, currentIndex, filterOpen, triggerNudge]);

  // Start/reset nudge timer when card changes, tab changes, or filter closes
  useEffect(() => {
    resetNudgeTimer();
    return () => {
      if (nudgeTimeoutRef.current) {
        clearTimeout(nudgeTimeoutRef.current);
      }
    };
  }, [currentIndex, activeTab, resetNudgeTimer]);

  const savedCards = useIcebreakerStore((s) => s.savedCards);
  const toggleSavedCard = useIcebreakerStore((s) => s.toggleSavedCard);

  const handleSave = useCallback(() => {
    const card = activeTab === 'icebreakers'
      ? cards[currentIndex]
      : compatibilityCards[compatibilityIndex];
    if (!card) return;
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleSavedCard(card as Icebreaker);
  }, [cards, currentIndex, compatibilityCards, compatibilityIndex, activeTab, hapticsEnabled, toggleSavedCard]);

  const currentCard = activeTab === 'icebreakers'
    ? cards[currentIndex]
    : compatibilityCards[compatibilityIndex];
  const isSaved = savedCards.some((c) => c.question === (currentCard?.question ?? ''));

  const shareCardRef = useRef<View>(null);

  const handleShare = useCallback(async () => {
    const card = activeTab === 'icebreakers'
      ? cards[currentIndex]
      : compatibilityCards[compatibilityIndex];
    if (!card) return;
    const emoji = CATEGORIES.find((c) => c.value === card.category)?.emoji || '';
    const prefix = activeTab === 'icebreakers' ? 'Dating Icebreaker' : 'Compatibility Question';
    try {
      await Share.share({ message: `${emoji} ${prefix}:\n\n"${card.question}"` });
    } catch {}
  }, [cards, currentIndex, compatibilityCards, compatibilityIndex, activeTab]);

  const handleShareResults = useCallback(async () => {
    if (!shareCardRef.current) return;
    try {
      const uri = await captureRef(shareCardRef, { format: 'png', quality: 1, fileName: 'WeVibe' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' });
    } catch {}
  }, []);

  const handleFilter = useCallback(() => {
    setShowSettingsFilter(true);
  }, []);
  const handleFilterSettings = useCallback(() => setShowSettingsFilter((v) => !v), []);
  const handleFilterSelect = useCallback(() => {
    hasSelectedVibeThisSession.current = true;
    setFilterOpen(false);
  }, []);
  const handleFilterDismiss = useCallback(() => setFilterOpen(false), []);
  const handleSettingsFilterSelect = useCallback(() => {
    hasSelectedVibeThisSession.current = true;
    setShowSettingsFilter(false);
  }, []);
  const handleSettingsFilterDismiss = useCallback(() => setShowSettingsFilter(false), []);

  const filterSlideY = useSharedValue(1000);
  useEffect(() => {
    const shouldShow = filterOpen || showSettingsFilter;
    filterSlideY.value = shouldShow
      ? withSpring(0, { damping: 26, stiffness: 400, mass: 0.8 })
      : withSpring(1000, { damping: 20, stiffness: 300 });
  }, [filterOpen, showSettingsFilter, filterSlideY]);

  const filterStyle = useAnimatedStyle(() => ({ transform: [{ translateY: filterSlideY.value }] }));
  const blurStyle = useAnimatedStyle(() => ({ opacity: interpolate(filterSlideY.value, [600, 0], [0, 1]) }));

  // Details modal animation
  const detailsSlideY = useSharedValue(1000);
  useEffect(() => {
    detailsSlideY.value = detailsOpen
      ? withSpring(0, { damping: 26, stiffness: 400, mass: 0.8 })
      : withSpring(1000, { damping: 20, stiffness: 300 });
  }, [detailsOpen, detailsSlideY]);
  const detailsStyle = useAnimatedStyle(() => ({ transform: [{ translateY: detailsSlideY.value }] }));
  const detailsBlurStyle = useAnimatedStyle(() => ({ opacity: interpolate(detailsSlideY.value, [600, 0], [0, 1]) }));

  // Tab indicator animation (0 = icebreakers, 1 = compatibility)
  const tabIndicatorPosition = useSharedValue(0);
  const tabIndicatorOpacity = useSharedValue(0);
  const [tabWidth, setTabWidth] = useState(0);

  // Update indicator position when tab changes
  useEffect(() => {
    const targetPosition = activeTab === 'icebreakers' ? 0 : tabWidth;
    tabIndicatorPosition.value = withTiming(targetPosition, { duration: 200, easing: Easing.out(Easing.quad) });
  }, [activeTab, tabWidth, tabIndicatorPosition]);

  // Fade in indicator when category is selected
  useEffect(() => {
    if (selectedCategory !== null) {
      tabIndicatorOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
    } else {
      tabIndicatorOpacity.value = 0;
    }
  }, [selectedCategory, tabIndicatorOpacity]);

  const tabIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabIndicatorPosition.value }],
    opacity: tabIndicatorOpacity.value,
  }));

  // Handle tab change
  const handleTabChange = useCallback((tab: TabType) => {
    if (tab === activeTab) return;
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
    // Reset card position
    translateX.value = 0;
    translateY.value = 0;
    cardRotation.value = 0;
    swipeProgress.value = 0;
    // Trigger smooth scale animation
    tabSwitchScale.value = 0.98;
    tabSwitchScale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
  }, [activeTab, translateX, translateY, cardRotation, swipeProgress, tabSwitchScale]);

  // Animated style for tab switch bounce
  const tabSwitchBounceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tabSwitchScale.value }],
  }));

  if (!fontsLoaded) return null;

  const hasFilter = selectedCategory != null;
  const frontCard = activeTab === 'icebreakers'
    ? (cards[currentIndex] ?? null)
    : (compatibilityCards[compatibilityIndex] ?? null);
  const backCard = activeTab === 'icebreakers'
    ? (cards[currentIndex + 1] ?? null)
    : (compatibilityCards[(compatibilityIndex + 1) % compatibilityCards.length] ?? null);
  const cardKey = activeTab === 'icebreakers' ? currentIndex : compatibilityIndex;

  const cardStyle = {
    borderRadius: 24,
    padding: 24,
    position: 'absolute' as const,
    top: 0, left: 0, right: 0, bottom: 0,
  };

  return (
    <View style={{ flex: 1, backgroundColor: activeTab === 'icebreakers' ? themeColors.background : themeColors.backgroundDark }}>
      <View style={{ flex: 1, paddingTop: insets.top + 12, paddingBottom: insets.bottom, paddingHorizontal: 30 }}>

        {/* Tab selector */}
        <View
          style={{ flexDirection: 'row', marginBottom: 32, backgroundColor: activeTab === 'icebreakers' ? themeColors.card : themeColors.cardDark, borderRadius: 100, padding: 4 }}
          onLayout={(e) => setTabWidth((e.nativeEvent.layout.width - 8) / 2)}
        >
          {/* Animated indicator - fades in when a vibe is selected */}
          <Animated.View
            style={[{
              position: 'absolute',
              top: 4,
              left: 4,
              width: tabWidth,
              height: '100%',
              backgroundColor: activeTab === 'icebreakers' ? themeColors.backgroundDark : '#FFFFFF',
              borderRadius: 100,
            }, tabIndicatorStyle]}
          />
          <Pressable
            onPress={() => handleTabChange('icebreakers')}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 100,
              alignItems: 'center',
            }}
            className="active:opacity-70"
          >
            <Text style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 14,
              color: selectedCategory === null ? 'rgba(26,26,26,0.4)' : (activeTab === 'icebreakers' ? '#FFFFFF' : 'rgba(255,255,255,0.4)'),
              letterSpacing: -0.3,
            }}>
              Ice Breakers
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleTabChange('compatibility')}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 100,
              alignItems: 'center',
            }}
            className="active:opacity-70"
          >
            <Text style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 14,
              color: selectedCategory === null ? 'rgba(26,26,26,0.4)' : (activeTab === 'compatibility' ? '#1A1A1A' : 'rgba(26,26,26,0.4)'),
              letterSpacing: -0.3,
            }}>
              Compatibility
            </Text>
          </Pressable>
        </View>

        {/* Card stack area */}
        <View style={{ flex: 1 }}>
          {(activeTab === 'icebreakers' && isLoading) ? (
            <View style={{ flex: 1, backgroundColor: themeColors.card, borderRadius: 24, padding: 24 }}>
              <Animated.View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, pulseStyle]}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#9A9790' }} />
              </Animated.View>
            </View>
          ) : (activeTab === 'icebreakers' && isError && cards.length === 0) ? (
            <View style={{ flex: 1, backgroundColor: themeColors.card, borderRadius: 24, padding: 24, justifyContent: 'center' }}>
              <Text style={{ color: '#9A9790', fontFamily: 'Inter_500Medium', textAlign: 'center' }}>
                Could not load icebreaker.{'\n'}Check your connection.
              </Text>
            </View>
          ) : activeTab === 'icebreakers' ? (
            <Animated.View style={[{ flex: 1 }, tabSwitchBounceStyle]}>
              {/* Back card - scales up as front card is dragged, text hidden */}
              {backCard ? (
                <Animated.View key={`back-${cardKey}`} style={[cardStyle, backCardStyle]}>
                  <CardContent icebreaker={backCard as Icebreaker} isfront={false} />
                </Animated.View>
              ) : null}

              {/* Front card - draggable, text animates in word by word */}
              {frontCard ? (
                <GestureDetector gesture={panGesture}>
                  <Animated.View key={`front-${activeTab}-${cardKey}`} style={[cardStyle, { backgroundColor: themeColors.card, zIndex: 2 }, frontCardStyle]}>
                    <CardContent icebreaker={frontCard as Icebreaker} isfront={true} />
                  </Animated.View>
                </GestureDetector>
              ) : null}
            </Animated.View>
          ) : showResults ? (
            /* Results screen - on background, no card */
            <View style={{ flex: 1 }}>
              <CompatibilityResults
                key="results-animated"
                answerHistory={answerHistory}
                totalQuestions={compatibilityCards.length}
                questions={compatibilityCards}
                onOpenDetails={() => setDetailsOpen(true)}
                onPlayAgain={handlePlayAgain}
                themeColors={themeColors}
                player1Name={player1Name}
                player2Name={player2Name}
              />
            </View>
          ) : (
            /* Compatibility mode - no manual swiping */
            <Animated.View style={[{ flex: 1 }, tabSwitchBounceStyle]}>
              {/* Back card - show results preview on last question ONLY after both answered, otherwise show next card */}
              {compatibilityIndex === compatibilityCards.length - 1 && person2Answer !== null ? (
                <View style={[cardStyle, { backgroundColor: 'transparent' }]}>
                  <CompatibilityResults
                    key="results-static"
                    answerHistory={[...answerHistory, { person1: person1Answer!, person2: person2Answer }]}
                    totalQuestions={compatibilityCards.length}
                    questions={compatibilityCards}
                    onOpenDetails={() => setDetailsOpen(true)}
                    onPlayAgain={handlePlayAgain}
                    animate={false}
                    themeColors={themeColors}
                    player1Name={player1Name}
                    player2Name={player2Name}
                  />
                </View>
              ) : backCard ? (
                <Animated.View key={`back-compat-${cardKey}`} style={[cardStyle, { backgroundColor: themeColors.cardDark }, backCardStyleDark]}>
                  {/* Show category and question number on back card */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: 'rgba(255,255,255,0.2)', letterSpacing: -0.5 }}>
                      {selectedCategory ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1) : ''}
                    </Text>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: 'rgba(255,255,255,0.2)', letterSpacing: -0.5 }}>
                      {compatibilityIndex + 2} of {compatibilityCards.length}
                    </Text>
                  </View>
                </Animated.View>
              ) : null}

              {/* Front card - NOT draggable in compatibility mode */}
              {frontCard ? (
                <Animated.View key={`front-compat-${cardKey}`} style={[cardStyle, { backgroundColor: themeColors.cardDark, zIndex: 2 }, frontCardStyle]}>
                  <CompatibilityCardContent
                    question={frontCard as CompatibilityQuestion}
                    isfront={true}
                    questionNumber={compatibilityIndex + 1}
                    totalQuestions={compatibilityCards.length}
                    currentPerson={currentPerson}
                    person1Answer={person1Answer}
                    person2Answer={person2Answer}
                    onAnswer={handleCompatibilityAnswer}
                    selectedCategory={selectedCategory}
                  />
                </Animated.View>
              ) : null}
            </Animated.View>
          )}
        </View>

        {/* Bottom buttons - different for each mode */}
        {activeTab === 'icebreakers' ? (
          <View style={{ marginTop: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable
              onPress={handleFilter}
              style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: themeColors.card, alignItems: 'center', justifyContent: 'center' }}
              className="active:opacity-70"
            >
              <SlidersHorizontal size={24} color={themeColors.backgroundDark} strokeWidth={2.5} />
            </Pressable>

            <Pressable
              onPress={handleSave}
              style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: themeColors.card, alignItems: 'center', justifyContent: 'center' }}
              className="active:opacity-70"
            >
              <Bookmark size={24} color={themeColors.backgroundDark} strokeWidth={2.5} fill={isSaved ? themeColors.backgroundDark : 'transparent'} />
            </Pressable>

            <Pressable
              onPress={handleShare}
              style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: themeColors.card, alignItems: 'center', justifyContent: 'center' }}
              className="active:opacity-70"
            >
              <Share2 size={24} color={themeColors.backgroundDark} strokeWidth={2.5} />
            </Pressable>
          </View>
        ) : showResults ? (
          /* Results mode - filter left, share right */
          <View style={{ marginTop: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable
              onPress={handleFilter}
              style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: themeColors.cardDark, alignItems: 'center', justifyContent: 'center' }}
              className="active:opacity-70"
            >
              <SlidersHorizontal size={24} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>

            <Pressable
              onPress={handleShareResults}
              style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: themeColors.cardDark, alignItems: 'center', justifyContent: 'center' }}
              className="active:opacity-70"
            >
              <Share2 size={24} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>
          </View>
        ) : (
          /* Compatibility mode - filter on left, person selectors on right */
          <View style={{ marginTop: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Filter button - no dot indicator in compatibility mode */}
            <Pressable
              onPress={handleFilter}
              style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: themeColors.cardDark, alignItems: 'center', justifyContent: 'center' }}
              className="active:opacity-70"
            >
              <SlidersHorizontal size={24} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>

            {/* Person selector circles with label on left */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {/* Up First / Up Next label */}
              <Text style={{
                fontFamily: 'Inter_700Bold',
                fontSize: 14,
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: -0.3,
              }}>
                {person1Answer === null
                  ? (player1Name ? `${player1Name}'s up` : 'Up First')
                  : (person2Answer === null
                    ? (player2Name ? `${player2Name}'s up` : 'Up Next')
                    : '')}
              </Text>

              {/* Person 1 */}
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: currentPerson === 1 && person1Answer === null ? '#FFFFFF' : themeColors.cardDark,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <User size={24} color={currentPerson === 1 && person1Answer === null ? themeColors.backgroundDark : '#FFFFFF'} strokeWidth={2.5} />
                {person1Answer !== null ? (
                  <View style={{ position: 'absolute', top: -6, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: themeColors.backgroundDark, fontSize: 14, fontFamily: 'Inter_700Bold' }}>✓</Text>
                  </View>
                ) : null}
              </View>

              {/* Person 2 */}
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: currentPerson === 2 && person2Answer === null ? '#FFFFFF' : themeColors.cardDark,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <User size={24} color={currentPerson === 2 && person2Answer === null ? themeColors.backgroundDark : '#FFFFFF'} strokeWidth={2.5} />
                {person2Answer !== null ? (
                  <View style={{ position: 'absolute', top: -6, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: themeColors.backgroundDark, fontSize: 14, fontFamily: 'Inter_700Bold' }}>✓</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Blur overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, blurStyle, { zIndex: 10 }]} pointerEvents={filterOpen || showSettingsFilter ? 'box-none' : 'none'}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => { setFilterOpen(false); setShowSettingsFilter(false); }}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>
        {savedCards.length > 0 && (
          <Pressable
            onPress={() => {
              if (hapticsEnabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push('/saved');
            }}
            style={{ position: 'absolute', top: insets.top + 12, right: 30, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100 }}
          >
            <Text style={{ color: '#000000', fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: -0.3 }}>Saved</Text>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 14 }}>{savedCards.length}</Text>
            </View>
          </Pressable>
        )}
      </Animated.View>


      {/* Tagline - only show when filter is open and no category selected */}
      {filterOpen && selectedCategory === null ? (
        <Animated.View
          style={[{
            position: 'absolute',
            top: insets.top + 100,
            left: 0,
            right: 0,
            alignItems: 'center',
            zIndex: 15,
          }, blurStyle]}
          pointerEvents="none"
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 30 }}>
            {['Less', 'small', 'talk.'].map((word, i) => (
              <AnimatedWord key={`line1-${i}-${word}`} word={word} index={i} trigger={true} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 30 }}>
            {['More', 'real', 'talk.'].map((word, i) => (
              <AnimatedWord key={`line2-${i}-${word}`} word={word} index={i + 3} trigger={true} />
            ))}
          </View>
        </Animated.View>
      ) : null}

      {/* Filter modal */}
      <Animated.View
        style={[{
          position: 'absolute', left: 10, right: 10, bottom: insets.bottom - 10,
          height: showSettingsFilter ? 610 : 550, backgroundColor: '#141414', borderRadius: 30,
          paddingTop: 24, paddingBottom: 16, zIndex: 20,
          overflow: 'hidden',
        }, filterStyle]}
        pointerEvents={filterOpen || showSettingsFilter ? 'auto' : 'none'}
      >
        {showSettingsFilter ? (
          <SettingsCategoryFilter onSelect={handleSettingsFilterSelect} onDismiss={handleSettingsFilterDismiss} />
        ) : (
          <CategoryFilter onSelect={handleFilterSelect} onDismiss={handleFilterDismiss} />
        )}
      </Animated.View>

      {/* Details modal blur overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, detailsBlurStyle, { zIndex: 25 }]} pointerEvents={detailsOpen ? 'auto' : 'none'}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setDetailsOpen(false)}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>
      </Animated.View>

      {/* Details modal */}
      <Animated.View
        style={[{
          position: 'absolute', left: 10, right: 10, bottom: insets.bottom - 10,
          height: 600, backgroundColor: '#141414', borderRadius: 30,
          paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16, zIndex: 30,
        }, detailsStyle]}
        pointerEvents={detailsOpen ? 'auto' : 'none'}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#FFFFFF', letterSpacing: -0.5 }}>
            Your Answers
          </Text>
          <Pressable
            onPress={() => {
              if (hapticsEnabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setDetailsOpen(false);
            }}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="active:opacity-70"
          >
            <X size={20} color="#FFFFFF" strokeWidth={3} />
          </Pressable>
        </View>

        {/* Scrollable list of questions */}
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {compatibilityCards.map((question, index) => {
            const record = answerHistory[index];
            if (!record) return null;
            const isMatch = record.person1 === record.person2;
            const person1AnswerText = question.answers[record.person1] || '';
            const person2AnswerText = question.answers[record.person2] || '';

            return (
              <View key={index} style={{ marginBottom: 20 }}>
                {/* Question */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: isMatch ? '#4CAF50' : '#E53935',
                    alignItems: 'center', justifyContent: 'center',
                    marginTop: 2,
                  }}>
                    {isMatch ? (
                      <Check size={16} color="#FFFFFF" strokeWidth={3} />
                    ) : (
                      <X size={16} color="#FFFFFF" strokeWidth={3} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFFFFF', letterSpacing: -0.3, marginBottom: 8 }}>
                      {question.question}
                    </Text>
                    <View style={{ gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                          Person 1:
                        </Text>
                        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.8)', flex: 1, flexWrap: 'wrap' }}>
                          {person1AnswerText}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                          Person 2:
                        </Text>
                        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.8)', flex: 1, flexWrap: 'wrap' }}>
                          {person2AnswerText}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Offscreen share card for results capture */}
      <View style={{ position: 'absolute', left: -9999 }}>
        <View
          ref={shareCardRef}
          collapsable={false}
          style={{
            width: 390,
            height: 520,
            backgroundColor: themeColors.backgroundDark,
            borderRadius: 24,
            padding: 32,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: 'rgba(255,255,255,0.5)', letterSpacing: -0.5, textAlign: 'center', marginBottom: 4 }}>
            {player1Name && player2Name ? `${player1Name} & ${player2Name}` : 'Compatibility Results'}
          </Text>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.3)', letterSpacing: -0.3, textAlign: 'center', marginBottom: 8 }}>
            Compatibility Test
          </Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 80, color: '#FFFFFF', letterSpacing: -4 }}>
            {answerHistory.length > 0 ? `${Math.round((answerHistory.filter(r => r.person1 === r.person2).length / answerHistory.length) * 100)}%` : '0%'}
          </Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#FFFFFF', letterSpacing: -0.5, marginTop: 24, textAlign: 'center' }}>
            {(() => {
              const pct = answerHistory.length > 0 ? Math.round((answerHistory.filter(r => r.person1 === r.person2).length / answerHistory.length) * 100) : 0;
              return pct >= 80 ? "You two are soulmates!" : pct >= 60 ? "Great connection!" : pct >= 40 ? "Some common ground" : pct >= 20 ? "Opposites attract?" : "Very different perspectives";
            })()}
          </Text>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8, textAlign: 'center' }}>
            {answerHistory.filter(r => r.person1 === r.person2).length} of {answerHistory.length} answers matched
          </Text>
        </View>
      </View>

    </View>
  );
}
