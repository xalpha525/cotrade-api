import { QueryClient } from '@tanstack/react-query';
import { QueryKeys } from '@/hooks/useApi';

export interface WalletCachePayload {
  id: string;
  address?: string;
  balanceUsd?: number;
  nativeBalance?: string;
  openPositionsCount?: number;
  activeStrategiesCount?: number;
  name?: string;
}

export interface PortfolioCachePayload {
  totalValueUsd?: number;
  totalBalanceUsd?: number;
  cashBalanceUsd?: number;
  availableBalanceUsd?: number;
  todayPnlUsd?: number;
  todayPnlPercent?: number;
  totalPnlUsd?: number;
  totalPnlPercent?: number;
  copyProfitUsd?: number;
  myPositions?: any[];
  copyPositions?: any[];
}

export interface NotificationCachePayload {
  id: string;
  title: string;
  summary: string;
  activityType: string;
  timestamp: string | number;
  txHash?: string;
  explorerUrl?: string;
}

/**
 * Granularly updates a single wallet's balance and properties in TanStack Query Cache
 * without re-fetching or replacing the entire wallet list array.
 */
export function updateWalletBalanceCache(queryClient: QueryClient, updatedWallet: WalletCachePayload): void {
  const beforeCacheData = queryClient.getQueryData(['wallets']);
  console.log('[DEBUG 5 BEFORE setQueryData]', JSON.stringify(beforeCacheData));

  queryClient.setQueryData<any[]>(QueryKeys.wallets, (oldWallets) => {
    if (!oldWallets) return [updatedWallet];

    let oldTargetWallet: any = null;
    let newTargetWallet: any = null;

    const newArray = oldWallets.map((w) => {
      if (w.id === updatedWallet.id || (updatedWallet.address && w.address === updatedWallet.address)) {
        oldTargetWallet = w;
        newTargetWallet = {
          ...w,
          balanceUsd: updatedWallet.balanceUsd !== undefined ? updatedWallet.balanceUsd : w.balanceUsd,
          nativeBalance: updatedWallet.nativeBalance !== undefined ? updatedWallet.nativeBalance : w.nativeBalance,
          openPositionsCount: updatedWallet.openPositionsCount !== undefined ? updatedWallet.openPositionsCount : w.openPositionsCount,
          activeStrategiesCount: updatedWallet.activeStrategiesCount !== undefined ? updatedWallet.activeStrategiesCount : w.activeStrategiesCount,
          name: updatedWallet.name !== undefined ? updatedWallet.name : w.name,
        };
        return newTargetWallet;
      }
      return w;
    });

    console.log('[DEBUG 1 updateWalletBalanceCache]', {
      queryKey: QueryKeys.wallets,
      oldWalletBalanceUsd: oldTargetWallet?.balanceUsd,
      newWalletBalanceUsd: newTargetWallet?.balanceUsd,
      oldWalletEqualsNewWallet: oldTargetWallet === newTargetWallet,
      oldArrayEqualsNewArray: oldWallets === newArray,
    });

    return newArray;
  });

  const afterCacheData = queryClient.getQueryData(['wallets']);
  console.log('[DEBUG 5 AFTER setQueryData]', JSON.stringify(afterCacheData));
}

/**
 * Granularly merges updated portfolio values into TanStack Query Cache
 * without triggering an HTTP refetch.
 */
export function updatePortfolioCache(queryClient: QueryClient, updatedPortfolio: PortfolioCachePayload): void {
  queryClient.setQueryData<any>(QueryKeys.portfolio, (oldPortfolio: any) => {
    if (!oldPortfolio) return updatedPortfolio;

    return {
      ...oldPortfolio,
      totalValueUsd: updatedPortfolio.totalValueUsd !== undefined ? updatedPortfolio.totalValueUsd : oldPortfolio.totalValueUsd,
      totalBalanceUsd: updatedPortfolio.totalBalanceUsd !== undefined ? updatedPortfolio.totalBalanceUsd : oldPortfolio.totalBalanceUsd,
      cashBalanceUsd: updatedPortfolio.cashBalanceUsd !== undefined ? updatedPortfolio.cashBalanceUsd : oldPortfolio.cashBalanceUsd,
      availableBalanceUsd: updatedPortfolio.availableBalanceUsd !== undefined ? updatedPortfolio.availableBalanceUsd : oldPortfolio.availableBalanceUsd,
      todayPnlUsd: updatedPortfolio.todayPnlUsd !== undefined ? updatedPortfolio.todayPnlUsd : oldPortfolio.todayPnlUsd,
      todayPnlPercent: updatedPortfolio.todayPnlPercent !== undefined ? updatedPortfolio.todayPnlPercent : oldPortfolio.todayPnlPercent,
      totalPnlUsd: updatedPortfolio.totalPnlUsd !== undefined ? updatedPortfolio.totalPnlUsd : oldPortfolio.totalPnlUsd,
      totalPnlPercent: updatedPortfolio.totalPnlPercent !== undefined ? updatedPortfolio.totalPnlPercent : oldPortfolio.totalPnlPercent,
      copyProfitUsd: updatedPortfolio.copyProfitUsd !== undefined ? updatedPortfolio.copyProfitUsd : oldPortfolio.copyProfitUsd,
      myPositions: updatedPortfolio.myPositions !== undefined ? updatedPortfolio.myPositions : oldPortfolio.myPositions,
      copyPositions: updatedPortfolio.copyPositions !== undefined ? updatedPortfolio.copyPositions : oldPortfolio.copyPositions,
    };
  });
}

/**
 * Prepends a new notification into TanStack Query Cache
 * without re-fetching the notifications API.
 */
export function updateNotificationCache(queryClient: QueryClient, newNotification: NotificationCachePayload): void {
  queryClient.setQueryData<any[]>(QueryKeys.notifications, (oldNotifications) => {
    if (!oldNotifications) return [newNotification];
    // Check if notification already exists
    if (oldNotifications.some((n) => n.id === newNotification.id)) return oldNotifications;
    return [newNotification, ...oldNotifications];
  });
}

/**
 * Granularly updates a strategy item in TanStack Query Cache.
 */
export function updateStrategyCache(queryClient: QueryClient, updatedStrategy: any): void {
  queryClient.setQueryData<any[]>(QueryKeys.strategies, (oldStrategies) => {
    if (!oldStrategies) return [updatedStrategy];
    return oldStrategies.map((s) => (s.id === updatedStrategy.id ? { ...s, ...updatedStrategy } : s));
  });
}
