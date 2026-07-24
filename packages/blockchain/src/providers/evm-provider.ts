import WebSocket from 'ws';
import type { ChainId } from '@copytrading/db';
import { logger } from '@copytrading/logger';
import type { IBlockchainProvider, RawTransactionEvent, TokenBalance } from './interfaces.js';

const ROBINHOOD_RPC_URL = process.env['ROBINHOOD_RPC_URL'] ?? 'https://robinhood-mainnet.g.alchemy.com/v2/alch_DCfnkc_WYi1DLlrcHK6LD';
const ROBINHOOD_WS_URL = process.env['ROBINHOOD_WS_URL'] ?? 'wss://robinhood-mainnet.g.alchemy.com/v2/alch_DCfnkc_WYi1DLlrcHK6LD';

// Reconnect delays: 2s → 4s → 8s → 16s → max 30s
const RECONNECT_DELAYS_MS = [2000, 4000, 8000, 16000, 30000];

interface SubscriptionState {
  address: string;
  wsSubscriptionId: string | null;
  handler: (tx: RawTransactionEvent) => Promise<void>;
}

export class EvmProvider implements IBlockchainProvider {
  readonly chainId: ChainId;

  private ws: WebSocket | null = null;
  private _isConnected = false;
  private reconnectAttempt = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private destroyed = false;
  private networkAvailable = true;

  private subscriptions = new Map<string, SubscriptionState>();
  private subIdToAddress = new Map<string, string>();
  private pendingRpc = new Map<number, (result: unknown) => void>();
  private rpcIdCounter = 1;

  constructor(chainIdInput?: ChainId | string) {
    if (chainIdInput === 'SOLANA_MAINNET' || chainIdInput === 'ROBINHOOD_MAINNET') {
      this.chainId = chainIdInput;
    } else {
      this.chainId = 'ROBINHOOD_MAINNET';
    }
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  async connect(): Promise<void> {
    if (!this.networkAvailable) {
      logger.warn({ chainId: this.chainId }, 'EvmProvider: network not available — skipping connect');
      return;
    }
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
    this._isConnected = false;
    this.subscriptions.clear();
    this.subIdToAddress.clear();
    logger.info({ chainId: this.chainId }, 'EvmProvider disconnected');
  }

  private async _openWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.info({ wsUrl: ROBINHOOD_WS_URL, chainId: this.chainId }, 'EvmProvider: connecting to Alchemy WebSocket...');

      let ws: WebSocket;
      try {
        ws = new WebSocket(ROBINHOOD_WS_URL);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.warn({ chainId: this.chainId, err: msg }, 'EvmProvider: WebSocket constructor failed — network unavailable');
        this.networkAvailable = false;
        return reject(new Error(`EvmProvider: cannot create WebSocket: ${msg}`));
      }

      this.ws = ws;

      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Alchemy WebSocket connection timeout'));
      }, 15_000);

      ws.once('open', () => {
        clearTimeout(timeout);
        this._isConnected = true;
        this.reconnectAttempt = 0;
        logger.info({ chainId: this.chainId }, 'EvmProvider: Alchemy WebSocket connected');

        // Re-subscribe all registered wallets
        for (const [address, state] of this.subscriptions) {
          this._sendAlchemySubscribe(address, state.handler).catch(err => {
            logger.warn({ address, err: err instanceof Error ? err.message : String(err) }, 'EvmProvider: re-subscribe failed');
          });
        }

        resolve();
      });

      ws.on('message', (raw: Buffer) => this._handleMessage(raw));

      ws.on('close', (code, reason) => {
        clearTimeout(timeout);
        this._isConnected = false;
        this.ws = null;
        this.subIdToAddress.clear();
        for (const state of this.subscriptions.values()) {
          state.wsSubscriptionId = null;
        }

        if (!this.destroyed) {
          const delay = RECONNECT_DELAYS_MS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)];
          logger.warn({ code, reason: reason.toString(), delayMs: delay }, 'EvmProvider: WebSocket closed — scheduling reconnect');
          this.reconnectTimer = setTimeout(() => {
            this.reconnectAttempt++;
            this._openWebSocket().catch(err => {
              logger.error({ err: err instanceof Error ? err.message : String(err) }, 'EvmProvider reconnect failed');
            });
          }, delay);
        }
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        const isNetworkErr = err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED');
        if (isNetworkErr) {
          logger.warn({ chainId: this.chainId, err: err.message }, 'EvmProvider: network unavailable — disabling auto-reconnect');
          this.networkAvailable = false;
        }
        logger.error({ err: err.message, chainId: this.chainId }, 'EvmProvider: WebSocket error');
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

    // Handle pending RPC responses
    if ('id' in msg && msg['id'] !== null && typeof msg['id'] === 'number') {
      const cb = this.pendingRpc.get(msg['id'] as number);
      if (cb) {
        this.pendingRpc.delete(msg['id'] as number);
        cb(msg['result']);
        return;
      }
    }

    // Handle alchemy_pendingTransactions notifications
    if (msg['method'] === 'eth_subscription') {
      const params = msg['params'] as Record<string, unknown> | undefined;
      const subscription = params?.['subscription'] as string | undefined;
      const result = params?.['result'] as Record<string, unknown> | undefined;

      if (!subscription || !result) return;

      const address = this.subIdToAddress.get(subscription);
      if (!address) return;

      const state = this.subscriptions.get(address);
      if (!state) return;

      const txHash = result['hash'] as string | undefined;
      if (!txHash) return;

      logger.info({ address, txHash }, 'EvmProvider: pending tx notification — fetching full tx');

      this._fetchTransaction(txHash)
        .then(txData => {
          if (!txData) return;
          const event: RawTransactionEvent = {
            chainId: this.chainId,
            txHash,
            blockNumber: BigInt(parseInt((result['blockNumber'] as string) ?? '0x0', 16)),
            walletAddress: address,
            programId: result['to'] as string | undefined,   // contract address = programId
            logs: [],
            rawPayload: txData,
            observedAt: new Date(),
          };
          return state.handler(event);
        })
        .catch(err => {
          logger.error({ txHash, err: err instanceof Error ? err.message : String(err) }, 'EvmProvider: error processing tx');
        });
    }
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
        reject(new Error(`EVM RPC timeout for ${method}`));
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

  private async _sendAlchemySubscribe(
    address: string,
    handler: (tx: RawTransactionEvent) => Promise<void>
  ): Promise<void> {
    // alchemy_pendingTransactions filters by from/to address
    const subId = await this._sendRpc<string>('eth_subscribe', [
      'alchemy_pendingTransactions',
      { fromAddress: address, toAddress: address, hashesOnly: false },
    ]);

    this.subIdToAddress.set(subId, address);
    const existing = this.subscriptions.get(address);
    if (existing) {
      existing.wsSubscriptionId = subId;
      existing.handler = handler;
    } else {
      this.subscriptions.set(address, { address, wsSubscriptionId: subId, handler });
    }

    logger.info({ address, subId, chainId: this.chainId }, 'EvmProvider: alchemy_pendingTransactions subscription ACK');
  }

  async subscribeWallet(
    address: string,
    onTransaction: (tx: RawTransactionEvent) => Promise<void>
  ): Promise<void> {
    if (!this.networkAvailable) {
      logger.warn({ address, chainId: this.chainId }, 'EvmProvider: network unavailable — wallet registered but not subscribed via WS');
      this.subscriptions.set(address, { address, wsSubscriptionId: null, handler: onTransaction });
      return;
    }

    if (!this._isConnected) {
      await this.connect().catch(() => {
        logger.warn({ address, chainId: this.chainId }, 'EvmProvider: connect failed — registering wallet for later');
        this.subscriptions.set(address, { address, wsSubscriptionId: null, handler: onTransaction });
        return;
      });
    }

    this.subscriptions.set(address, { address, wsSubscriptionId: null, handler: onTransaction });

    if (this._isConnected) {
      await this._sendAlchemySubscribe(address, onTransaction);
    }
  }

  async unsubscribeWallet(address: string): Promise<void> {
    const state = this.subscriptions.get(address);
    if (state?.wsSubscriptionId) {
      try {
        await this._sendRpc('eth_unsubscribe', [state.wsSubscriptionId]);
      } catch {
        // Best-effort
      }
      this.subIdToAddress.delete(state.wsSubscriptionId);
    }
    this.subscriptions.delete(address);
    logger.info({ address, chainId: this.chainId }, 'EvmProvider: wallet unsubscribed');
  }

  async getNativeBalance(address: string): Promise<string> {
    const retries = [0, 1000, 3000];
    for (const delay of retries) {
      if (delay > 0) await new Promise(r => setTimeout(r, delay));
      try {
        const res = await fetch(ROBINHOOD_RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 'bal', method: 'eth_getBalance',
            params: [address, 'latest'],
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (res.status === 429) {
          logger.warn({ address }, 'Alchemy rate limit on eth_getBalance — retrying');
          continue;
        }
        if (!res.ok) throw new Error(`Alchemy RPC ${res.status}`);

        const json = (await res.json()) as { result?: string; error?: { message: string } };

        if (json?.error) throw new Error(json.error.message);

        const weiHex = json?.result ?? '0x0';
        const weiBigInt = BigInt(weiHex).toString();
        logger.info({ address, wei: weiBigInt, chainId: this.chainId }, 'EvmProvider: native balance fetched');
        return weiBigInt;
      } catch (err) {
        logger.warn({ address, err: err instanceof Error ? err.message : String(err), delay },
          'EvmProvider: getNativeBalance attempt failed');
        if (delay === retries[retries.length - 1]) throw err;
      }
    }
    throw new Error('EvmProvider: getNativeBalance all retries exhausted');
  }

  async getTokenBalances(address: string): Promise<TokenBalance[]> {
    try {
      const res = await fetch(ROBINHOOD_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 'tokbal', method: 'alchemy_getTokenBalances',
          params: [address, 'erc20'],
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) throw new Error(`alchemy_getTokenBalances HTTP ${res.status}`);

      const json = (await res.json()) as {
        result?: {
          tokenBalances?: Array<{
            contractAddress: string;
            tokenBalance: string | null;
          }>;
        };
        error?: { message: string };
      };

      if (json?.error) throw new Error(json.error.message);

      const balances: TokenBalance[] = (json?.result?.tokenBalances ?? [])
        .filter(tb => tb.tokenBalance && tb.tokenBalance !== '0x0')
        .map(tb => ({
          mintAddress: tb.contractAddress,
          symbol: '',
          decimals: 18,                  // ERC-20 default; metadata lookup would refine this
          rawAmount: BigInt(tb.tokenBalance!).toString(),
          uiAmount: Number(BigInt(tb.tokenBalance!)) / 1e18,
        }));

      logger.info({ address, tokenCount: balances.length, chainId: this.chainId }, 'EvmProvider: token balances fetched');
      return balances;
    } catch (err) {
      logger.warn({ address, chainId: this.chainId, err: err instanceof Error ? err.message : String(err) },
        'EvmProvider: getTokenBalances failed — returning empty');
      return [];
    }
  }

  private async _fetchTransaction(txHash: string): Promise<Record<string, unknown> | null> {
    try {
      const res = await fetch(ROBINHOOD_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 'gettx',
          method: 'eth_getTransactionByHash',
          params: [txHash],
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) throw new Error(`eth_getTransactionByHash HTTP ${res.status}`);
      const json = (await res.json()) as { result?: Record<string, unknown> };
      return json?.result ?? null;
    } catch (err) {
      logger.warn({ txHash, err: err instanceof Error ? err.message : String(err) }, 'EvmProvider: _fetchTransaction failed');
      return null;
    }
  }

  async healthCheck(): Promise<{ isHealthy: boolean; latencyMs: number; error?: string }> {
    if (!this.networkAvailable) {
      return { isHealthy: false, latencyMs: 0, error: 'Network unavailable for this chain' };
    }

    const start = Date.now();
    try {
      const res = await fetch(ROBINHOOD_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 'hc', method: 'eth_blockNumber', params: [] }),
        signal: AbortSignal.timeout(5000),
      });

      const latencyMs = Date.now() - start;
      if (!res.ok) return { isHealthy: false, latencyMs, error: `HTTP ${res.status}` };

      const json = (await res.json()) as { result?: string; error?: { message: string } };
      if (json?.error) return { isHealthy: false, latencyMs, error: json.error.message };

      const blockNumber = json?.result ?? '0x0';
      logger.debug({ chainId: this.chainId, blockNumber }, 'EvmProvider: health check OK');
      return { isHealthy: true, latencyMs };
    } catch (err) {
      return {
        isHealthy: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : 'EvmProvider health check error',
      };
    }
  }

  async simulateIncomingTransaction(tx: RawTransactionEvent): Promise<void> {
    const state = this.subscriptions.get(tx.walletAddress.toLowerCase());
    if (state) await state.handler(tx);
  }
}
