import { Decimal, prisma, SignalRepository, TraderRepository } from '@copytrading/db';
import { InMemoryEventBus, type MasterTradeDetectedEvent } from '@copytrading/events';
import { logger } from '@copytrading/logger';
import { DecoderRegistry } from '../decoders/decoder-registry.js';
import { JupiterDecoder } from '../decoders/jupiter.decoder.js';
import { MeteoraDecoder } from '../decoders/meteora.decoder.js';
import { OrcaDecoder } from '../decoders/orca.decoder.js';
import { RaydiumDecoder } from '../decoders/raydium.decoder.js';
import { UniswapV2Decoder } from '../decoders/uniswap-v2.decoder.js';
import { UniswapV3Decoder } from '../decoders/uniswap-v3.decoder.js';
import type { RawTransactionEvent } from '../providers/interfaces.js';
import { PriceService } from '../services/price.service.js';

const NATIVE_SOL = 'So11111111111111111111111111111111111111112';
const USDC_SOL = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const WETH_EVM = '0xc02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const USDC_EVM = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

import { UnifiedTradeAnalyticsProcessor } from '../engine/unified-analytics-processor.js';

export class TransactionPipeline {
  private readonly decoderRegistry = new DecoderRegistry();
  private readonly signalRepo = new SignalRepository(prisma);
  private readonly traderRepo = new TraderRepository(prisma);
  private readonly eventBus = new InMemoryEventBus();
  private readonly priceService = new PriceService();
  private readonly analyticsProcessor = new UnifiedTradeAnalyticsProcessor();

  constructor() {
    this.decoderRegistry.register(new RaydiumDecoder());
    this.decoderRegistry.register(new JupiterDecoder());
    this.decoderRegistry.register(new OrcaDecoder());
    this.decoderRegistry.register(new MeteoraDecoder());
    this.decoderRegistry.register(new UniswapV2Decoder());
    this.decoderRegistry.register(new UniswapV3Decoder());
  }

  async processIncomingTransaction(tx: RawTransactionEvent): Promise<void> {
    const programOrContract = tx.programId ?? 'UNKNOWN';
    const decoded = this.decoderRegistry.decodeTransaction(programOrContract, tx.rawPayload);

    logger.info(
      { txHash: tx.txHash, actionType: decoded.actionType, dexId: decoded.dexId },
      'Transaction decoded by pipeline'
    );

    if (decoded.actionType !== 'SWAP' || !decoded.swapData) {
      return;
    }

    const { swapData } = decoded;

    // Derive Trade Side:
    // If tokenIn is Native/Stable -> BUY (swapping base/quote to asset)
    // Else if tokenOut is Native/Stable -> SELL (swapping asset back to base/quote)
    const isTokenInBase = [NATIVE_SOL, USDC_SOL, WETH_EVM, USDC_EVM].includes(swapData.tokenInAddress);
    const side: 'BUY' | 'SELL' = isTokenInBase ? 'BUY' : 'SELL';

    // Fetch live price for tokenIn to calculate amountUsd
    const priceInUsd = await this.priceService.getPrice(swapData.tokenInAddress, tx.chainId);
    const rawAmtIn = parseFloat(swapData.amountIn) || 0;
    // Account for 9 decimals on SOL / 18 on EVM if needed, otherwise fallback to rawAmtIn * price
    const calculatedUsd = swapData.amountUsd
      ? parseFloat(swapData.amountUsd)
      : rawAmtIn * priceInUsd;

    // 1. Create TradeSignal in DB
    const signal = await this.signalRepo.createSignal({
      chainId: tx.chainId,
      txHash: tx.txHash,
      blockNumber: tx.blockNumber,
      walletAddress: tx.walletAddress,
      tokenInAddress: swapData.tokenInAddress,
      tokenOutAddress: swapData.tokenOutAddress,
      amountIn: new Decimal(swapData.amountIn),
      amountOut: new Decimal(swapData.amountOut),
      rawJson: tx.rawPayload
    });

    // 2. Link ObservedTrade if trader exists
    const trader = await this.traderRepo.findByWalletAddress(tx.walletAddress);
    if (trader) {
      await this.signalRepo.createObservedTrade({
        signalId: signal.id,
        traderId: trader.id,
        side,
        tokenInAddress: swapData.tokenInAddress,
        tokenOutAddress: swapData.tokenOutAddress,
        amountIn: new Decimal(swapData.amountIn),
        amountOut: new Decimal(swapData.amountOut),
        amountUsd: new Decimal(calculatedUsd > 0 ? calculatedUsd : 0)
      });
    }

    // 3. Process trade through Unified Analytics Processor (PositionEngine -> StatisticsEngine)
    const targetTokenAddress = side === 'BUY' ? swapData.tokenOutAddress : swapData.tokenInAddress;
    const targetTokenSymbol = (swapData as any).tokenSymbol ?? (side === 'BUY' ? 'TOKEN_OUT' : 'TOKEN_IN');
    const tradeAmount = side === 'BUY'
      ? (parseFloat(swapData.amountOut) || 1)
      : (parseFloat(swapData.amountIn) || 1);

    try {
      await this.analyticsProcessor.processTrade({
        walletAddress: tx.walletAddress,
        userId: trader?.id ?? undefined,
        chainId: tx.chainId,
        tokenAddress: targetTokenAddress,
        tokenSymbol: targetTokenSymbol,
        side,
        amount: tradeAmount,
        priceUsd: calculatedUsd > 0 ? calculatedUsd / tradeAmount : priceInUsd,
        timestamp: Date.now(),
      });
    } catch (analyticsErr) {
      logger.error(
        { wallet: tx.walletAddress, err: analyticsErr instanceof Error ? analyticsErr.message : String(analyticsErr) },
        'TransactionPipeline: Error updating analytics for master trader trade'
      );
    }

    // 4. Emit MASTER_TRADE_DETECTED domain event
    const event: MasterTradeDetectedEvent = {
      eventId: `evt_${Math.random().toString(36).slice(2, 10)}`,
      eventType: 'MASTER_TRADE_DETECTED',
      correlationId: `corr_${tx.txHash}`,
      timestamp: Date.now(),
      masterWallet: tx.walletAddress,
      txHash: tx.txHash,
      tokenIn: swapData.tokenInAddress,
      tokenOut: swapData.tokenOutAddress,
      amountIn: swapData.amountIn,
      amountOut: swapData.amountOut
    };

    await this.eventBus.publish(event);
    await this.signalRepo.updateStatus(signal.id, 'DISPATCHED');
  }
}
