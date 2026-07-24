import { walletMonitorQueue, type WalletMonitorJobPayload } from '@copytrading/queue';
import { prisma } from '@copytrading/db';
import { logger } from '@copytrading/logger';
import { eventBus } from '@copytrading/events';
import { ProviderFactory } from '../providers/provider-factory.js';
import { TransactionPipeline } from '../pipeline/transaction-pipeline.js';
import { PriceService } from '../services/price.service.js';
import { CopyExecutionEngine } from '../execution/copy-execution-engine.js';

const NATIVE_SOL = 'So11111111111111111111111111111111111111112';
const NATIVE_ETH = '0x0000000000000000000000000000000000000000';

export class WalletMonitoringWorker {
  private transactionPipeline = new TransactionPipeline();
  private priceService = new PriceService();
  private copyExecutionEngine = new CopyExecutionEngine();

  start(): void {
    logger.info('Starting WalletMonitoringWorker daemon...');

    walletMonitorQueue.process(async (payload: WalletMonitorJobPayload) => {
      await this.handleWalletJob(payload);
    });

    // Auto-subscribe all active traders from DB on startup for real-time live monitoring
    this._subscribeAllActiveTradersOnStartup().catch((err) => {
      logger.error({ err: err instanceof Error ? err.message : String(err) }, 'WalletMonitoringWorker: Failed to subscribe active traders on startup');
    });
  }

  private async _subscribeAllActiveTradersOnStartup(): Promise<void> {
    const activeTraders = await prisma.trader.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
    });

    logger.info({ count: activeTraders.length }, 'WalletMonitoringWorker: Auto-subscribing active traders to Helius WebSockets');

    for (const trader of activeTraders) {
      try {
        const provider = ProviderFactory.getProvider(trader.chainId);
        await provider.subscribeWallet(trader.walletAddress, async (tx) => {
          logger.info({ txHash: tx.txHash, wallet: tx.walletAddress }, 'Worker received live on-chain transaction');
          try {
            await this.transactionPipeline.processIncomingTransaction(tx);
          } catch (err) {
            logger.error({ err: err instanceof Error ? err.message : String(err) }, 'Error in transaction pipeline');
          }

          try {
            await this.copyExecutionEngine.processDetectedTraderTrade(tx);
          } catch (err) {
            logger.error({ err: err instanceof Error ? err.message : String(err) }, 'Error in copy execution engine');
          }
        });
        logger.info({ wallet: trader.walletAddress }, 'WalletMonitoringWorker: Successfully subscribed trader to live Helius WebSocket');
      } catch (err) {
        logger.warn({ wallet: trader.walletAddress, err: err instanceof Error ? err.message : String(err) }, 'WalletMonitoringWorker: Failed to subscribe trader on startup');
      }
    }
  }

  async handleWalletJob(payload: WalletMonitorJobPayload): Promise<void> {
    logger.info({ walletId: payload.walletId, address: payload.address, action: payload.action }, 'WalletMonitoringWorker processing job');

    try {
      const provider = ProviderFactory.getProvider(payload.chainId);

      if (payload.action === 'SUBSCRIBE' || payload.action === 'REFRESH_BALANCE') {
        // 1. Resolve or create valid Wallet record ID to avoid Foreign Key errors
        let targetWalletId = payload.walletId;
        const existingWallet = await prisma.wallet.findFirst({
          where: { address: payload.address },
        });

        if (existingWallet) {
          targetWalletId = existingWallet.id;
        } else {
          let user = await prisma.user.findFirst();
          if (!user) {
            user = await prisma.user.create({
              data: {
                privyId: `privy_sys_${Date.now()}`,
                email: `system_${Date.now()}@copytrading.internal`,
                role: 'FOLLOWER',
              },
            });
          }
          const createdWallet = await prisma.wallet.create({
            data: {
              userId: user.id,
              address: payload.address,
              chainId: payload.chainId,
              isPrimary: false,
            },
          });
          targetWalletId = createdWallet.id;
        }

        // 2. Fetch live balances (wrapped safely)
        try {
          const nativeBalance = await provider.getNativeBalance(payload.address);
          const nativeMint = payload.chainId === 'SOLANA_MAINNET' ? NATIVE_SOL : NATIVE_ETH;
          const nativePriceUsd = await this.priceService.getPrice(nativeMint, payload.chainId);

          const nativeDecimals = payload.chainId === 'SOLANA_MAINNET' ? 9 : 18;
          const nativeUiAmount = Number(BigInt(nativeBalance)) / Math.pow(10, nativeDecimals);
          let totalUsd = nativeUiAmount * nativePriceUsd;

          const tokenBalances = await provider.getTokenBalances(payload.address);
          for (const tb of tokenBalances) {
            const tokenPrice = await this.priceService.getPrice(tb.mintAddress, payload.chainId);
            totalUsd += tb.uiAmount * tokenPrice;
          }

          const balanceUsd = Math.round(totalUsd * 100) / 100;

          await prisma.walletBalance.upsert({
            where: { walletId: targetWalletId },
            create: {
              walletId: targetWalletId,
              nativeBalance,
              balanceUsd,
            },
            update: {
              nativeBalance,
              balanceUsd,
            },
          });

          await eventBus.publish({
            eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            eventType: 'WALLET_BALANCE_UPDATED',
            timestamp: Date.now(),
            walletId: targetWalletId,
            address: payload.address,
            chainId: payload.chainId,
            balanceUsd,
            tokens: [],
          }).catch(() => {});
        } catch (e) {
          logger.warn(
            { address: payload.address, err: e instanceof Error ? e.message : String(e) },
            'WalletMonitoringWorker: RPC balance fetch failed — proceeding to live subscription'
          );
        }

        // 3. Register real WebSocket subscription with provider
        await provider.subscribeWallet(payload.address, async (tx) => {
          logger.info({ txHash: tx.txHash, wallet: tx.walletAddress }, 'Worker received live on-chain transaction');

          // Process transaction through decoder pipeline
          try {
            await this.transactionPipeline.processIncomingTransaction(tx);
          } catch (err) {
            logger.error({ err: err instanceof Error ? err.message : String(err) }, 'Error in transaction pipeline');
          }

          // Trigger Copy Execution Engine evaluation
          try {
            await this.copyExecutionEngine.processDetectedTraderTrade(tx);
          } catch (err) {
            logger.error({ err: err instanceof Error ? err.message : String(err) }, 'Error in copy execution engine');
          }
        });

        logger.info({ address: payload.address }, 'WalletMonitoringWorker: Live subscription active');
      } else if (payload.action === 'UNSUBSCRIBE') {
        await provider.unsubscribeWallet(payload.address);
      }
    } catch (error) {
      logger.error({ error, payload }, 'Failed to process wallet monitor job');
      throw error;
    }
  }
}
