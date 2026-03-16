import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Icebreaker {
  question: string;
  category: string;
  emoji: string;
}

export type CategoryType =
  | 'flirty'
  | 'deep'
  | 'funny'
  | 'travel'
  | 'food'
  | 'dreams'
  | 'music'
  | 'random'
  | 'adventure'
  | null;

export interface CategoryInfo {
  value: CategoryType;
  emoji: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { value: 'flirty', emoji: '💋' },
  { value: 'deep', emoji: '🌙' },
  { value: 'funny', emoji: '😂' },
  { value: 'travel', emoji: '✈️' },
  { value: 'food', emoji: '🍕' },
  { value: 'dreams', emoji: '✨' },
  { value: 'music', emoji: '🎵' },
  { value: 'random', emoji: '🎲' },
  { value: 'adventure', emoji: '🏕️' },
];

interface IcebreakerStore {
  cachedIcebreaker: Icebreaker | null;
  cachedDate: string | null;
  cachedCategory: CategoryType;
  selectedCategory: CategoryType;
  savedCards: Icebreaker[];
  setCachedIcebreaker: (icebreaker: Icebreaker, date: string) => void;
  setSelectedCategory: (category: CategoryType) => void;
  clearCache: () => void;
  toggleSavedCard: (card: Icebreaker) => void;
  removeSavedCard: (question: string) => void;
}

const useIcebreakerStore = create<IcebreakerStore>()(
  persist(
    (set) => ({
      cachedIcebreaker: null,
      cachedDate: null,
      cachedCategory: null,
      selectedCategory: null,
      savedCards: [],
      setCachedIcebreaker: (icebreaker, date) =>
        set((state) => ({
          cachedIcebreaker: icebreaker,
          cachedDate: date,
          cachedCategory: state.selectedCategory,
        })),
      setSelectedCategory: (category) =>
        set({
          selectedCategory: category,
          cachedIcebreaker: null,
          cachedDate: null,
          cachedCategory: null,
        }),
      clearCache: () =>
        set({
          cachedIcebreaker: null,
          cachedDate: null,
          cachedCategory: null,
        }),
      toggleSavedCard: (card) =>
        set((state) => {
          const exists = state.savedCards.some((c) => c.question === card.question);
          return {
            savedCards: exists
              ? state.savedCards.filter((c) => c.question !== card.question)
              : [...state.savedCards, card],
          };
        }),
      removeSavedCard: (question) =>
        set((state) => ({
          savedCards: state.savedCards.filter((c) => c.question !== question),
        })),
    }),
    {
      name: "icebreaker-storage-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        cachedIcebreaker: state.cachedIcebreaker,
        cachedDate: state.cachedDate,
        cachedCategory: state.cachedCategory,
        savedCards: state.savedCards,
        // Don't persist selectedCategory - always start with vibe picker open
      }),
    }
  )
);

export default useIcebreakerStore;
