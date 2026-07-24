import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@/lib/api';

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const QueryKeys = {
  health: ['health'] as const,
  traders: (query?: string) => ['traders', query ?? ''] as const,
  trader: (id: string) => ['traders', id] as const,
  traderStats: (id: string) => ['traders', id, 'stats'] as const,
  traderTrades: (id: string) => ['traders', id, 'trades'] as const,
  traderHoldings: (id: string) => ['traders', id, 'holdings'] as const,
  traderFollowers: (id: string) => ['traders', id, 'followers'] as const,
  portfolio: ['portfolio'] as const,
  wallets: ['wallets'] as const,
  followers: ['followers'] as const,
  strategies: ['strategies'] as const,
  trades: ['trades'] as const,
  notifications: ['notifications'] as const,
  userMe: ['user', 'me'] as const,
} as const;

const getApiUrl = () => process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000';

const getAuthHeaders = async () => {
  const client = getApiClient();
  const token = await (client as any).getAuthToken?.();
  return {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

// ─── Queries ────────────────────────────────────────────────────────────────

export const useHealth = () => {
  const client = getApiClient();
  return useQuery({
    queryKey: QueryKeys.health,
    queryFn: () => client.getHealth(),
    staleTime: 1000 * 30,
  });
};

export const useTraders = (searchQuery?: string) => {
  return useQuery({
    queryKey: QueryKeys.traders(searchQuery),
    queryFn: async () => {
      const q = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
      const res = await fetch(`${getApiUrl()}/api/v1/traders${q}`, {
        headers: await getAuthHeaders(),
      });
      const json = await res.json();
      return json.data ?? [];
    },
  });
};

export const useTraderDetail = (id: string) => {
  return useQuery({
    queryKey: QueryKeys.trader(id),
    queryFn: async () => {
      const res = await fetch(`${getApiUrl()}/api/v1/traders/${id}`, {
        headers: await getAuthHeaders(),
      });
      const json = await res.json();
      return json.data;
    },
    enabled: !!id,
  });
};

export const useTraderStats = (id: string) => {
  return useQuery({
    queryKey: QueryKeys.traderStats(id),
    queryFn: async () => {
      const res = await fetch(`${getApiUrl()}/api/v1/traders/${id}/stats`, {
        headers: await getAuthHeaders(),
      });
      const json = await res.json();
      return json.data;
    },
    enabled: !!id,
  });
};

export const useTraderTrades = (id: string) => {
  return useQuery({
    queryKey: QueryKeys.traderTrades(id),
    queryFn: async () => {
      const res = await fetch(`${getApiUrl()}/api/v1/traders/${id}/trades`, {
        headers: await getAuthHeaders(),
      });
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!id,
  });
};

export const useTraderHoldings = (id: string) => {
  return useQuery({
    queryKey: QueryKeys.traderHoldings(id),
    queryFn: async () => {
      const res = await fetch(`${getApiUrl()}/api/v1/traders/${id}/holdings`, {
        headers: await getAuthHeaders(),
      });
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!id,
  });
};

export const useTraderFollowers = (id: string) => {
  return useQuery({
    queryKey: QueryKeys.traderFollowers(id),
    queryFn: async () => {
      const res = await fetch(`${getApiUrl()}/api/v1/traders/${id}/followers`, {
        headers: await getAuthHeaders(),
      });
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!id,
  });
};

export const useTrades = () => {
  return useQuery({
    queryKey: QueryKeys.trades,
    queryFn: async () => {
      const res = await fetch(`${getApiUrl()}/api/v1/trades`, {
        headers: await getAuthHeaders(),
      });
      const json = await res.json();
      return json.data ?? [];
    },
  });
};

export const usePortfolio = () => {
  return useQuery({
    queryKey: QueryKeys.portfolio,
    queryFn: async () => {
      const res = await fetch(`${getApiUrl()}/api/v1/portfolio`, {
        headers: await getAuthHeaders(),
      });
      const json = await res.json();
      return json.data ?? json;
    },
    staleTime: 30000,
  });
};

export const useWallets = () => {
  const queryResult = useQuery({
    queryKey: QueryKeys.wallets,
    queryFn: async () => {
      const res = await fetch(`${getApiUrl()}/api/v1/wallets`, {
        headers: await getAuthHeaders(),
      });
      const json = await res.json();
      return json.data ?? [];
    },
    staleTime: 30000,
  });

  if (queryResult.data) {
    console.log('[DEBUG 4 useWallets Return]', {
      queryKey: QueryKeys.wallets,
      dataLength: queryResult.data.length,
      balances: queryResult.data.map((w: any) => ({ id: w.id, balanceUsd: w.balanceUsd })),
    });
  }

  return queryResult;
};

export const useStrategies = () => {
  return useQuery({
    queryKey: QueryKeys.strategies,
    queryFn: async () => {
      const res = await fetch(`${getApiUrl()}/api/v1/strategies`, {
        headers: await getAuthHeaders(),
      });
      const json = await res.json();
      return json.data ?? [];
    },
    staleTime: 30000,
  });
};

export const useNotifications = () => {
  return useQuery({
    queryKey: QueryKeys.notifications,
    queryFn: async () => {
      const res = await fetch(`${getApiUrl()}/api/v1/notifications`, {
        headers: await getAuthHeaders(),
      });
      const json = await res.json();
      return json.data ?? [];
    },
    staleTime: 30000,
  });
};

export const useUserMe = () => {
  return useQuery({
    queryKey: QueryKeys.userMe,
    queryFn: async () => {
      const res = await fetch(`${getApiUrl()}/api/v1/users/me`, {
        headers: await getAuthHeaders(),
      });
      const json = await res.json();
      return json.data;
    },
    retry: false,
  });
};

export const usePortfolioStats = () => {
  return useQuery({
    queryKey: [...QueryKeys.portfolio, 'stats'],
    queryFn: async () => {
      const res = await fetch(`${getApiUrl()}/api/v1/portfolio/stats`, {
        headers: await getAuthHeaders(),
      });
      const json = await res.json();
      return json.data ?? {};
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });
};

export const useWalletBalance = (walletId: string) => {
  return useQuery({
    queryKey: ['wallets', walletId, 'balance'],
    queryFn: async () => {
      const res = await fetch(`${getApiUrl()}/api/v1/wallets/${walletId}/balance`, {
        headers: await getAuthHeaders(),
      });
      const json = await res.json();
      return json.data ?? { balanceUsd: 0, nativeBalance: '0' };
    },
    enabled: !!walletId,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });
};

// ─── Mutations ──────────────────────────────────────────────────────────────

export const useCreatePrivyWallet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { chainId: 'SOLANA_MAINNET' | 'ROBINHOOD_MAINNET'; name?: string }) => {
      const res = await fetch(`${getApiUrl()}/api/v1/wallets/create-privy`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to create Privy wallet');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.wallets });
      queryClient.invalidateQueries({ queryKey: QueryKeys.portfolio });
    },
  });
};

export const useSaveCopyStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (strategyConfig: any) => {
      const res = await fetch(`${getApiUrl()}/api/v1/strategies`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(strategyConfig),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? json.error ?? 'Failed to save strategy');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.strategies });
      queryClient.invalidateQueries({ queryKey: QueryKeys.portfolio });
      queryClient.invalidateQueries({ queryKey: QueryKeys.followers });
    },
  });
};

export const useRenameWallet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { walletId: string; name: string }) => {
      const res = await fetch(`${getApiUrl()}/api/v1/wallets/${data.walletId}`, {
        method: 'PATCH',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ name: data.name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to rename wallet');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.wallets });
    },
  });
};

export const useRemoveWallet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (walletId: string) => {
      const res = await fetch(`${getApiUrl()}/api/v1/wallets/${walletId}`, {
        method: 'DELETE',
        headers: await getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to remove wallet');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.wallets });
      queryClient.invalidateQueries({ queryKey: QueryKeys.portfolio });
    },
  });
};

export const useAddTrader = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { handle: string; address: string; chain: string }) => {
      const res = await fetch(`${getApiUrl()}/api/v1/traders`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to add trader');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['traders'] });
    },
  });
};
