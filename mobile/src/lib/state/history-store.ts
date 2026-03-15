import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface HistoryFact {
  year: string;
  event: string;
  month: string;
  day: string;
  title: string;
  wikipediaUrl: string;
}

export type CategoryType =
  | 'weird'
  | 'science'
  | 'royalty'
  | 'inventions'
  | 'exploration'
  | 'art & culture'
  | 'ancient'
  | 'modern'
  | null;

interface HistoryStore {
  cachedFact: HistoryFact | null;
  cachedDate: string | null;
  cachedCategory: CategoryType;
  selectedCategory: CategoryType;
  setCachedFact: (fact: HistoryFact, date: string) => void;
  setSelectedCategory: (category: CategoryType) => void;
  clearCache: () => void;
}

const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      cachedFact: null,
      cachedDate: null,
      cachedCategory: null,
      selectedCategory: null,
      setCachedFact: (fact, date) =>
        set((state) => ({
          cachedFact: fact,
          cachedDate: date,
          cachedCategory: state.selectedCategory,
        })),
      setSelectedCategory: (category) =>
        set({
          selectedCategory: category,
          cachedFact: null,
          cachedDate: null,
          cachedCategory: null,
        }),
      clearCache: () =>
        set({
          cachedFact: null,
          cachedDate: null,
          cachedCategory: null,
        }),
    }),
    {
      name: "history-storage-v4",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useHistoryStore;
