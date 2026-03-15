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
  setCachedIcebreaker: (icebreaker: Icebreaker, date: string) => void;
  setSelectedCategory: (category: CategoryType) => void;
  clearCache: () => void;
}

const useIcebreakerStore = create<IcebreakerStore>()(
  persist(
    (set) => ({
      cachedIcebreaker: null,
      cachedDate: null,
      cachedCategory: null,
      selectedCategory: null,
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
    }),
    {
      name: "icebreaker-storage-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        cachedIcebreaker: state.cachedIcebreaker,
        cachedDate: state.cachedDate,
        cachedCategory: state.cachedCategory,
        // Don't persist selectedCategory - always start with vibe picker open
      }),
    }
  )
);

export default useIcebreakerStore;
