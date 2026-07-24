import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';
import { secureStorage, StorageKeys } from '@/lib/storage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function Index() {
  const router = useRouter();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isHydrated) return;

    const timer = setTimeout(() => {
      const onboardingDone = secureStorage.get(StorageKeys.ONBOARDING_COMPLETED);

      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else if (onboardingDone === 'true') {
        router.replace('/(auth)/login');
      } else {
        router.replace('/(auth)/onboarding');
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isHydrated, isAuthenticated, router]);

  return <LoadingSpinner />;
}
