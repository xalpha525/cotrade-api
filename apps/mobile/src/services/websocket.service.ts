import { QueryClient } from '@tanstack/react-query';
import {
  updateWalletBalanceCache,
  updatePortfolioCache,
  updateNotificationCache,
  updateStrategyCache,
} from '@/lib/cache-helpers';

export type EventCallback = (data: any) => void;

const getWsUrl = () => {
  const apiUrl = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000';
  return apiUrl.replace(/^http/, 'ws') + '/ws';
};

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private isConnected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private token: string | null = null;
  private queryClient: QueryClient | null = null;

  setQueryClient(client: QueryClient) {
    this.queryClient = client;
  }

  init(token: string, client?: QueryClient) {
    this.token = token;
    if (client) this.queryClient = client;
    this.connect();
  }

  private connect() {
    if (this.ws || !this.token) return;

    try {
      const url = `${getWsUrl()}?token=${this.token}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('[WS] Real-time WebSocket connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { type, data } = payload;

          // 1. Direct Granular TanStack Query Cache Mutation (Zero HTTP requests)
          if (this.queryClient && data) {
            switch (type) {
              case 'WALLET_BALANCE_UPDATE':
              case 'WALLET_BALANCE_UPDATED':
                updateWalletBalanceCache(this.queryClient, data);
                break;
              case 'PORTFOLIO_UPDATE':
                updatePortfolioCache(this.queryClient, data);
                break;
              case 'NOTIFICATION_ADDED':
                updateNotificationCache(this.queryClient, data);
                break;
              case 'STRATEGY_UPDATED':
                updateStrategyCache(this.queryClient, data);
                break;
            }
          }

          // 2. Notify any component-level subscribers
          if (type && this.listeners.has(type)) {
            this.listeners.get(type)!.forEach((cb) => cb(data));
          }
        } catch (err) {
          console.warn('[WS] Error parsing message', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.ws = null;
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('[WS] Connection error', err);
      };
    } catch (err) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 5000);
  }

  subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(callback);
      }
    };
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.listeners.clear();
  }
}

export const wsService = new WebSocketService();
