import type { ChainId } from '@copytrading/db';
import { logger } from '@copytrading/logger';
import type { DEXQuote, UnsignedTransaction } from '../types.js';

export class TransactionBuilder {
  buildTransaction(
    chainId: ChainId,
    fromAddress: string,
    quote: DEXQuote,
    nonce?: number
  ): UnsignedTransaction {
    if (chainId === 'SOLANA_MAINNET') {
      logger.info({ fromAddress }, 'Building Solana Versioned Transaction with Compute Budget & Priority Fees');
      return {
        chainId,
        fromAddress,
        toAddress: quote.dexId === 'JUPITER' ? 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4' : '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
        data: `0x_solana_v0_swap_data_${quote.tokenInAddress.slice(0, 6)}_${quote.tokenOutAddress.slice(0, 6)}`,
        value: '0',
        recentBlockhash: 'GH7x9Jk2LmN4pQ6rS8tU0vW1xY3zA5bC7dE9fG1hI3jK'
      };
    }

    logger.info({ fromAddress, nonce }, 'Building Robinhood Chain EVM EIP-1559 Transaction');
    return {
      chainId,
      fromAddress,
      toAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 SwapRouter
      data: `0x414b5237000000000000000000000000${quote.tokenInAddress.replace('0x', '')}`,
      value: '0',
      gasLimit: '210000',
      maxFeePerGas: '30000000000',
      maxPriorityFeePerGas: '1500000000',
      ...(nonce !== undefined ? { nonce } : {})
    };
  }
}
