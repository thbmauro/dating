import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ColorTheme = 'warm' | 'cool' | 'neutral';

export interface ThemeColors {
  background: string;
  backgroundDark: string;
  card: string;
  cardDark: string;
  cardBack: string;
  cardBackDark: string;
  accent: string;
}

export const THEME_COLORS: Record<ColorTheme, ThemeColors> = {
  warm: {
    background: '#F5EBD8',
    backgroundDark: '#2A1F14',
    card: '#F0DFC0',
    cardDark: '#3D2E1F',
    cardBack: '#D9C8A5',
    cardBackDark: '#3D2E1F',
    accent: '#F5CB5C',
  },
  cool: {
    background: '#D8DFEF',
    backgroundDark: '#141828',
    card: '#C5D0E8',
    cardDark: '#252D45',
    cardBack: '#9AAAD0',
    cardBackDark: '#252D45',
    accent: '#A7ACD9',
  },
  neutral: {
    background: '#EBEBEB',
    backgroundDark: '#1A1A1A',
    card: '#DEDEDE',
    cardDark: '#2A2A2A',
    cardBack: '#A8A8A8',
    cardBackDark: '#2A2A2A',
    accent: '#9E9E9E',
  },
};

interface SettingsStore {
  colorTheme: ColorTheme;
  hapticsEnabled: boolean;
  player1Name: string;
  player2Name: string;
  setColorTheme: (theme: ColorTheme) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setPlayer1Name: (name: string) => void;
  setPlayer2Name: (name: string) => void;
}

const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      colorTheme: 'warm',
      hapticsEnabled: true,
      player1Name: '',
      player2Name: '',
      setColorTheme: (theme) => set({ colorTheme: theme }),
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
      setPlayer1Name: (name) => set({ player1Name: name }),
      setPlayer2Name: (name) => set({ player2Name: name }),
    }),
    {
      name: "settings-storage-v1",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useSettingsStore;
