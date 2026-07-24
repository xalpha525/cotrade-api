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
  }

  async handleWalletJob(payload: WalletMonitorJobPayload): Promise<void> {
    logger.info({ walletId: payload.walletId, address: payload.address, action: payload.action }, 'WalletMonitoringWorker processing job');

    try {
      const provider = ProviderFactory.getProvider(payload.chainId);

      if (payload.action === 'SUBSCRIBE' || payload.action === 'REFRESH_BALANCE') {
        // 1. Fetch live native balance & token balances from blockchain
        let nativeBalance = '0';
        let balanceUsd = 0;

        try {
          nativeBalance = await provider.getNativeBalance(payload.address);
          
          const nativeMint = payload.chainId === 'SOLANA_MAINNET' ? NATIVE_SOL : NATIVE_ETH;
          const nativePriceUsd = await this.priceService.getPrice(nativeMint, payload.chainId);

          // Calculate native balance USD
          const nativeDecimals = payload.chainId === 'SOLANA_MAINNET' ? 9 : 18;
          const nativeUiAmount = Number(BigInt(nativeBalance)) / Math.pow(10, nativeDecimals);
          let totalUsd = nativeUiAmount * nativePriceUsd;

          // Fetch token balances & calculate total token value in USD
          const tokenBalances = await provider.getTokenBalances(payload.address);
          for (const tb of tokenBalances) {
            const tokenPrice = await this.priceService.getPrice(tb.mintAddress, payload.chainId);
            totalUsd += tb.uiAmount * tokenPrice;
          }

          balanceUsd = Math.round(totalUsd * 100) / 100;

          logger.info(
            { address: payload.address, nativeBalance, balanceUsd, tokenCount: tokenBalances.length },
            'WalletMonitoringWorker: Live balance fetched successfully'
          );
        } catch (e) {
          logger.warn(
            { address: payload.address, err: e instanceof Error ? e.message : String(e) },
            'WalletMonitoringWorker: RPC balance fetch failed — retaining existing DB balance'
          );
          // Retrieve last known balance from DB if RPC fails
          const existing = await prisma.walletBalance.findUnique({ where: { walletId: payload.walletId } });
          if (existing) {
            nativeBalance = existing.nativeBalance;
            balanceUsd = existing.balanceUsd;
          }
        }

        // 2. Persist real balance in Database
        await prisma.walletBalance.upsert({
          where: { walletId: payload.walletId },
          create: {
            walletId: payload.walletId,
            nativeBalance,
            balanceUsd,
          },
          update: {
            nativeBalance,
            balanceUsd,
          },
        });

        // Publish domain event
        try {
          await eventBus.publish({
            eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            eventType: 'WALLET_BALANCE_UPDATED',
            timestamp: Date.now(),
            walletId: payload.walletId,
            address: payload.address,
            chainId: payload.chainId,
            balanceUsd,
            tokens: [],
          });
        } catch (evtErr) {
          logger.warn({ walletId: payload.walletId, err: evtErr }, 'Failed to publish WALLET_BALANCE_UPDATED event');
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

          // Trigger balance refresh after transaction
          try {
            const updatedNative = await provider.getNativeBalance(payload.address);
            const nativeMint = payload.chainId === 'SOLANA_MAINNET' ? NATIVE_SOL : NATIVE_ETH;
            const priceUsd = await this.priceService.getPrice(nativeMint, payload.chainId);
            const nativeDecimals = payload.chainId === 'SOLANA_MAINNET' ? 9 : 18;
            const updatedUi = Number(BigInt(updatedNative)) / Math.pow(10, nativeDecimals);
            const updatedUsd = Math.round(updatedUi * priceUsd * 100) / 100;

            await prisma.walletBalance.upsert({
              where: { walletId: payload.walletId },
              create: { walletId: payload.walletId, nativeBalance: updatedNative, balanceUsd: updatedUsd },
              update: { nativeBalance: updatedNative, balanceUsd: updatedUsd },
            });

            // Publish domain event after live transaction balance update
            await eventBus.publish({
              eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              eventType: 'WALLET_BALANCE_UPDATED',
              timestamp: Date.now(),
              walletId: payload.walletId,
              address: payload.address,
              chainId: payload.chainId,
              balanceUsd: updatedUsd,
              tokens: [],
            });
            logger.info({ walletId: payload.walletId, balanceUsd: updatedUsd }, 'Published WALLET_BALANCE_UPDATED after on-chain transaction');
          } catch (err) {
            logger.warn({ walletId: payload.walletId }, 'Failed to refresh balance after transaction');
          }
        });
      } else if (payload.action === 'UNSUBSCRIBE') {
        await provider.unsubscribeWallet(payload.address);
      }
    } catch (error) {
      logger.error({ error, payload }, 'Failed to process wallet monitor job');
      throw error;
    }
  }
}
