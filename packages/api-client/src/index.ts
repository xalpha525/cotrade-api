import type { MasterTrader, Order, Position } from '@copytrading/types';

export interface ApiClientConfig {
  baseUrl: string;
  getAuthToken?: (() => Promise<string | null>) | undefined;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export class CopyTradingApiClient {
  private readonly baseUrl: string;
  private readonly getAuthToken?: (() => Promise<string | null>) | undefined;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.getAuthToken = config.getAuthToken;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>)
      };

      if (this.getAuthToken) {
        const token = await this.getAuthToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers
      });

      const json = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        return {
          data: null,
          error: json?.error ?? `HTTP Error ${res.status}`,
          status: res.status
        };
      }

      return { data: json as unknown as T, error: null, status: res.status };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Network request failed',
        status: 0
      };
    }
  }

  async getHealth(): Promise<ApiResponse<{ status: string; uptime: number }>> {
    return this.request<{ status: string; uptime: number }>('/health');
  }

  async getMasterTraders(): Promise<ApiResponse<MasterTrader[]>> {
    return this.request<MasterTrader[]>('/api/v1/traders');
  }

  async getOrders(): Promise<ApiResponse<Order[]>> {
    return this.request<Order[]>('/api/v1/orders');
  }

  async getPositions(): Promise<ApiResponse<Position[]>> {
    return this.request<Position[]>('/api/v1/positions');
  }
}
