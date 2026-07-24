import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

export const useAuth = () => {
  const router = useRouter();
  const { token, user, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  const authenticateWithBackend = useCallback(
    async (
      privyToken: string,
      privyPayload?: {
        privyId?: string;
        email?: string | null;
        wallets?: Array<{ address: string; chainType?: string; walletClientType?: string }>;
      }
    ) => {
      const apiUrl = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000';

      console.log('ABOUT TO CALL BACKEND');
      console.log('API URL:', apiUrl);
      console.log('TOKEN:', privyToken);
      console.log('[AUTH] Backend authentication request with payload:', privyPayload);

      const res = await fetch(`${apiUrl}/api/v1/auth/privy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${privyToken}`,
        },
        body: JSON.stringify({
          token: privyToken,
          privyId: privyPayload?.privyId,
          email: privyPayload?.email,
          wallets: privyPayload?.wallets ?? [],
        }),
      });

      console.log('BACKEND STATUS:', res.status);
      console.log(`[AUTH] Backend response status: ${res.status}`);

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.error(`[AUTH] Backend authentication failed (${res.status}): ${errorText}`);
        throw new Error(`Backend authentication failed with status ${res.status}`);
      }

      const body = (await res.json()) as {
        data?: {
          token?: string;
          user?: { id: string; email: string | null; privyId: string; role: string };
        };
      };

      const authToken = body.data?.token ?? privyToken;
      const backendUser = body.data?.user;

      if (!backendUser) {
        throw new Error('Backend authentication response missing user object');
      }

      setAuth(authToken, backendUser);
      console.log('[AUTH] User stored');

      router.replace('/(tabs)');
      console.log('[AUTH] Navigation complete');
    },
    [setAuth, router]
  );

  const logout = useCallback(() => {
    clearAuth();
    router.replace('/(auth)/login');
  }, [clearAuth, router]);

  return {
    token,
    user,
    isAuthenticated,
    authenticateWithBackend,
    logout,
  };
};
