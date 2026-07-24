import type { ChainId } from '@copytrading/db';
import { logger } from '@copytrading/logger';
import { Broadcaster } from './services/broadcaster.js';
import { ConfirmationWatcher } from './services/confirmation-watcher.js';
import { FailureRecoveryManager } from './services/failure-recovery.js';
import { PortfolioUpdater } from './services/portfolio-updater.js';
import { QuoteService } from './services/quote.service.js';
import { ReceiptProcessor } from './services/receipt-processor.js';
import { SignerService } from './services/signer.service.js';
import { SimulationService } from './services/simulation.service.js';
import { TransactionBuilder } from './services/transaction-builder.js';
import { WalletResolver } from './services/wallet-resolver.js';
import type { TransactionReceipt } from './types.js';

export interface ExecutionJobRequest {
  executionId: string;
  followerUserId: string;
  followerId: string;
  walletAddress: string;
  chainId: ChainId;
  tokenInAddress: string;
  tokenOutAddress: string;
  amountIn: string;
  maxSlippageBps: number;
}

export class ProductionExecutionEngine {
  private readonly walletResolver = new WalletResolver();
  private readonly quoteService = new QuoteService();
  private readonly transactionBuilder = new TransactionBuilder();
  private readonly simulationService = new SimulationService();
  private readonly signerService = new SignerService();
  private readonly broadcaster = new Broadcaster();
  private readonly confirmationWatcher = new ConfirmationWatcher();
  private readonly receiptProcessor = new ReceiptProcessor();
  private readonly portfolioUpdater = new PortfolioUpdater();
  private readonly failureRecovery = new FailureRecoveryManager();

  async executeTrade(request: ExecutionJobRequest): Promise<{ success: boolean; receipt?: TransactionReceipt; error?: string }> {
    logger.info({ executionId: request.executionId, chainId: request.chainId }, 'ProductionExecutionEngine pipeline starting on-chain trade execution');

    try {
      // 1. Resolve Wallet Signer
      const signer = await this.walletResolver.resolveWalletSigner(request.walletAddress, request.chainId);

      // 2. Fetch DEX Quote
      const quote = await this.quoteService.fetchBestQuote(
        request.chainId,
        request.tokenInAddress,
        request.tokenOutAddress,
        request.amountIn,
        request.maxSlippageBps
      );

      // 3. Build Transaction
      const unsignedTx = this.transactionBuilder.buildTransaction(request.chainId, request.walletAddress, quote);

      // 4. Pre-flight Simulation
      const simulation = await this.simulationService.simulatePreflight(unsignedTx);
      if (!simulation.success) {
        throw new Error(simulation.failureReason ?? 'Pre-flight simulation failed');
      }

      // 5. Wallet Signing
      const signedTx = await this.signerService.sign(signer, unsignedTx);

      // 6. Broadcast Transaction
      await this.broadcaster.broadcastTransaction(signedTx);

      // 7. Watch Confirmation
      const receipt = await this.confirmationWatcher.waitForConfirmation(signedTx.txHash);

      // 8. Process Receipt
      this.receiptProcessor.processReceipt(receipt);

      // 9. Update Portfolio & Holdings
      await this.portfolioUpdater.updatePortfolioOnConfirmation(
        request.followerUserId,
        request.followerId,
        request.tokenInAddress,
        request.tokenOutAddress,
        request.amountIn,
        quote.expectedAmountOut,
        receipt
      );

      logger.info({ executionId: request.executionId, txHash: receipt.txHash }, 'ProductionExecutionEngine trade execution successfully completed!');
      return { success: true, receipt };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown execution failure');
      await this.failureRecovery.handleExecutionFailure(request.executionId, error, 0);
      return { success: false, error: error.message };
    }
  }
}
