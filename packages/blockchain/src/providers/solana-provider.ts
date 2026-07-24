import WebSocket from 'ws';
import type { ChainId } from '@copytrading/db';
import { logger } from '@copytrading/logger';
import type { IBlockchainProvider, RawTransactionEvent, TokenBalance } from './interfaces.js';

const HELIUS_API_KEY = process.env['HELIUS_API_KEY'] ?? 'cc98bdff-c30f-42ca-944d-54c952adb750';
const HELIUS_RPC_URL = process.env['HELIUS_RPC_URL'] ?? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const HELIUS_WS_URL = process.env['HELIUS_WS_URL'] ?? `wss://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// Reconnect delays: 2s → 4s → 8s → 16s → max 30s
const RECONNECT_DELAYS_MS = [2000, 4000, 8000, 16000, 30000];

interface SubscriptionState {
  address: string;
  wsSubscriptionId: number | null;
  handler: (tx: RawTransactionEvent) => Promise<void>;
}

export class SolanaProvider implements IBlockchainProvider {
  readonly chainId: ChainId = 'SOLANA_MAINNET';

  private ws: WebSocket | null = null;
  private connected = false;
  private reconnectAttempt = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private destroyed = false;

  // address → subscription state
  private subscriptions = new Map<string, SubscriptionState>();
  // wsSubscriptionId → address (for mapping Helius notifications back to handler)
  private subIdToAddress = new Map<number, string>();
  // pending RPC request callbacks
  private pendingRpc = new Map<number, (result: unknown) => void>();
  private rpcIdCounter = 1;

  get isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    await this._openWebSocket();
  }

  async disconnect(): Promise<void> {
    this.destroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.connected = false;
    this.subscriptions.clear();
    this.subIdToAddress.clear();
    logger.info('SolanaProvider disconnected');
  }

  private async _openWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.info({ wsUrl: HELIUS_WS_URL }, 'SolanaProvider: connecting to Helius WebSocket...');
      const ws = new WebSocket(HELIUS_WS_URL);
      this.ws = ws;

      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Helius WebSocket connection timeout'));
      }, 10_000);

      ws.once('open', () => {
        clearTimeout(timeout);
        this.connected = true;
        this.reconnectAttempt = 0;
        logger.info('SolanaProvider: Helius WebSocket connected');

        // Re-subscribe all wallets that were registered before reconnect
        for (const [address, state] of this.subscriptions) {
          this._sendLogsSubscribe(address, state.handler).catch(err => {
            logger.warn({ address, err: err instanceof Error ? err.message : String(err) }, 'Re-subscribe failed after reconnect');
          });
        }

        resolve();
      });

      ws.on('message', (raw: Buffer) => this._handleMessage(raw));

      ws.on('close', (code, reason) => {
        clearTimeout(timeout);
        this.connected = false;
        this.ws = null;
        this.subIdToAddress.clear();
        // Reset wsSubscriptionId on all subscriptions
        for (const state of this.subscriptions.values()) {
          state.wsSubscriptionId = null;
        }

        if (!this.destroyed) {
          const delay = RECONNECT_DELAYS_MS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)];
          logger.warn({ code, reason: reason.toString(), delayMs: delay, attempt: this.reconnectAttempt + 1 },
            'SolanaProvider: WebSocket closed — scheduling reconnect');
          this.reconnectTimer = setTimeout(() => {
            this.reconnectAttempt++;
            this._openWebSocket().catch(err => {
              logger.error({ err: err instanceof Error ? err.message : String(err) }, 'SolanaProvider reconnect failed');
            });
          }, delay);
        }
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        logger.error({ err: err.message }, 'SolanaProvider: WebSocket error');
        reject(err);
      });
    });
  }

  private _handleMessage(raw: Buffer): void {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw.toString()) as Record<string, unknown>;
    } catch {
      return;
    }

    // Handle RPC responses (to pending requests like logsSubscribe ACK)
    if ('id' in msg && msg['id'] !== null) {
      const id = msg['id'] as number;
      const cb = this.pendingRpc.get(id);
      if (cb) {
        this.pendingRpc.delete(id);
        cb(msg['result']);
        return;
      }
    }

    // Handle subscription notifications
    if (msg['method'] === 'logsNotification') {
      const params = msg['params'] as Record<string, unknown> | undefined;
      const result = params?.['result'] as Record<string, unknown> | undefined;
      const context = result?.['context'] as { slot: number } | undefined;
      const value = result?.['value'] as Record<string, unknown> | undefined;
      const subscription = params?.['subscription'] as number | undefined;

      if (!subscription || !value) return;

      const address = this.subIdToAddress.get(subscription);
      if (!address) return;

      const state = this.subscriptions.get(address);
      if (!state) return;

      const signature = value['signature'] as string | undefined;
      const logs = value['logs'] as string[] | undefined;
      const err = value['err'];

      // Skip failed transactions
      if (err !== null && err !== undefined) return;
      if (!signature) return;

      logger.info({ address, signature, slot: context?.slot }, 'SolanaProvider: log notification received — fetching full tx');

      // Fetch full transaction data from Helius RPC
      this._fetchTransaction(signature)
        .then(txData => {
          if (!txData) return;
          const event: RawTransactionEvent = {
            chainId: 'SOLANA_MAINNET',
            txHash: signature,
            blockNumber: BigInt(context?.slot ?? 0),
            walletAddress: address,
            programId: this._extractProgramId(logs ?? []),
            logs: logs ?? [],
            rawPayload: txData,
            observedAt: new Date(),
          };
          return state.handler(event);
        })
        .catch(err => {
          logger.error({ signature, err: err instanceof Error ? err.message : String(err) },
            'SolanaProvider: error processing log notification');
        });
    }
  }

  private _extractProgramId(logs: string[]): string | undefined {
    // Logs format: "Program <programId> invoke [1]"
    for (const log of logs) {
      const match = log.match(/^Program (\S+) invoke \[1\]/);
      if (match?.[1] && match[1] !== 'ComputeBudget111111111111111111111111111111') {
        return match[1];
      }
    }
    return undefined;
  }

  private async _sendRpc<T = unknown>(method: string, params: unknown[]): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const id = this.rpcIdCounter++;
      const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params });

      const timeout = setTimeout(() => {
        this.pendingRpc.delete(id);
        reject(new Error(`RPC timeout for ${method}`));
      }, 15_000);

      this.pendingRpc.set(id, (result) => {
        clearTimeout(timeout);
        resolve(result as T);
      });

      this.ws!.send(msg, (err) => {
        if (err) {
          clearTimeout(timeout);
          this.pendingRpc.delete(id);
          reject(err);
        }
      });
    });
  }

  private async _sendLogsSubscribe(address: string, handler: (tx: RawTransactionEvent) => Promise<void>): Promise<void> {
    const subId = await this._sendRpc<number>('logsSubscribe', [
      { mentions: [address] },
      { commitment: 'confirmed' },
    ]);

    this.subIdToAddress.set(subId, address);
    const state = this.subscriptions.get(address);
    if (state) {
      state.wsSubscriptionId = subId;
      state.handler = handler;
    } else {
      this.subscriptions.set(address, { address, wsSubscriptionId: subId, handler });
    }

    logger.info({ address, subId }, 'SolanaProvider: logsSubscribe ACK received');
  }

  async subscribeWallet(
    address: string,
    onTransaction: (tx: RawTransactionEvent) => Promise<void>
  ): Promise<void> {
    // Ensure connected
    if (!this.connected) {
      await this.connect();
    }

    // Register handler before subscribe (in case message arrives fast)
    this.subscriptions.set(address, { address, wsSubscriptionId: null, handler: onTransaction });

    await this._sendLogsSubscribe(address, onTransaction);
  }

  async unsubscribeWallet(address: string): Promise<void> {
    const state = this.subscriptions.get(address);
    if (state?.wsSubscriptionId !== null && state?.wsSubscriptionId !== undefined) {
      try {
        await this._sendRpc('logsUnsubscribe', [state.wsSubscriptionId]);
      } catch {
        // Best-effort unsubscribe
      }
      this.subIdToAddress.delete(state.wsSubscriptionId);
    }
    this.subscriptions.delete(address);
    logger.info({ address }, 'SolanaProvider: wallet unsubscribed');
  }

  async getNativeBalance(address: string): Promise<string> {
    const retries = [0, 500, 1500];
    for (const delay of retries) {
      if (delay > 0) await new Promise(r => setTimeout(r, delay));
      try {
        const res = await fetch(HELIUS_RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 'bal', method: 'getBalance',
            params: [address, { commitment: 'confirmed' }],
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (res.status === 429) {
          logger.warn({ address }, 'Helius rate limit on getBalance — retrying');
          continue;
        }
        if (!res.ok) throw new Error(`Helius RPC ${res.status}`);

        const json = (await res.json()) as { result?: { value?: number } };
        const lamports = json?.result?.value;
        if (lamports === undefined) throw new Error('No lamports in response');

        const balStr = lamports.toString();
        logger.info({ address, lamports: balStr }, 'SolanaProvider: native balance fetched');
        return balStr;
      } catch (err) {
        logger.warn({ address, err: err instanceof Error ? err.message : String(err) },
          `SolanaProvider: getNativeBalance attempt failed (retry ${delay}ms)`);
        if (delay === retries[retries.length - 1]) throw err;
      }
    }
    throw new Error('getNativeBalance: all retries exhausted');
  }

  async getTokenBalances(address: string): Promise<TokenBalance[]> {
    try {
      const res = await fetch(HELIUS_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 'tok', method: 'getTokenAccountsByOwner',
          params: [
            address,
            { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
            { encoding: 'jsonParsed', commitment: 'confirmed' },
          ],
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) throw new Error(`Helius getTokenAccountsByOwner ${res.status}`);

      const json = (await res.json()) as {
        result?: {
          value?: Array<{
            account: {
              data: {
                parsed: {
                  info: {
                    mint: string;
                    tokenAmount: {
                      amount: string;
                      decimals: number;
                      uiAmount: number | null;
                    };
                  };
                };
              };
            };
          }>;
        };
      };

      const accounts = json?.result?.value ?? [];
      const balances: TokenBalance[] = accounts
        .map(acc => {
          const info = acc.account.data.parsed.info;
          const tokenAmount = info.tokenAmount;
          if (!tokenAmount.amount || tokenAmount.amount === '0') return null;
          return {
            mintAddress: info.mint,
            symbol: '',           // symbol fetched via TokenMetadataService
            decimals: tokenAmount.decimals,
            rawAmount: tokenAmount.amount,
            uiAmount: tokenAmount.uiAmount ?? 0,
          } as TokenBalance;
        })
        .filter((b): b is TokenBalance => b !== null);

      logger.info({ address, tokenCount: balances.length }, 'SolanaProvider: token balances fetched');
      return balances;
    } catch (err) {
      logger.warn({ address, err: err instanceof Error ? err.message : String(err) },
        'SolanaProvider: getTokenBalances failed — returning empty');
      return [];
    }
  }

  private async _fetchTransaction(signature: string): Promise<Record<string, unknown> | null> {
    try {
      const res = await fetch(HELIUS_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 'tx',
          method: 'getTransaction',
          params: [signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) throw new Error(`getTransaction HTTP ${res.status}`);

      const json = (await res.json()) as { result?: Record<string, unknown> };
      return json?.result ?? null;
    } catch (err) {
      logger.warn({ signature, err: err instanceof Error ? err.message : String(err) },
        'SolanaProvider: _fetchTransaction failed');
      return null;
    }
  }

  async healthCheck(): Promise<{ isHealthy: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const res = await fetch(HELIUS_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 'hc', method: 'getHealth', params: [] }),
        signal: AbortSignal.timeout(5000),
      });

      const latencyMs = Date.now() - start;
      if (!res.ok) return { isHealthy: false, latencyMs, error: `HTTP ${res.status}` };

      const json = (await res.json()) as { result?: string };
      return { isHealthy: json?.result === 'ok', latencyMs };
    } catch (err) {
      return {
        isHealthy: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : 'Helius health check error',
      };
    }
  }

  /** For testing: manually trigger the on-transaction handler as if Helius sent a notification */
  async simulateIncomingTransaction(tx: RawTransactionEvent): Promise<void> {
    const state = this.subscriptions.get(tx.walletAddress);
    if (state) await state.handler(tx);
  }
}
