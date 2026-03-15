import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import CategoryFilter from '@/components/CategoryFilter';

export default function ModalScreen() {
  const router = useRouter();

  return (
    <>
      <CategoryFilter onSelect={() => router.back()} />
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </>
  );
}
