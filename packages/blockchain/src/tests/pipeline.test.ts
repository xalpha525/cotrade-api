import { DecoderRegistry } from '../decoders/decoder-registry.js';
import { JupiterDecoder } from '../decoders/jupiter.decoder.js';
import { RaydiumDecoder } from '../decoders/raydium.decoder.js';
import { UniswapV2Decoder } from '../decoders/uniswap-v2.decoder.js';
import { UniswapV3Decoder } from '../decoders/uniswap-v3.decoder.js';

export async function runBlockchainTests(): Promise<void> {
  console.log('🧪 Running Blockchain Decoder & Pipeline Tests...');

  const registry = new DecoderRegistry();
  registry.register(new RaydiumDecoder());
  registry.register(new JupiterDecoder());
  registry.register(new UniswapV2Decoder());
  registry.register(new UniswapV3Decoder());

  // Test 1: Raydium V4 Swap Decoding
  const raydiumResult = registry.decodeTransaction('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', {
    tokenIn: 'So11111111111111111111111111111111111111112',
    tokenOut: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amountIn: '1000000000',
    amountOut: '150000000'
  });

  if (raydiumResult.actionType !== 'SWAP' || raydiumResult.dexId !== 'RAYDIUM') {
    throw new Error('Test Failed: Raydium decoder invalid');
  }
  console.log('  ✓ Raydium DEX decoder passed');

  // Test 2: Uniswap V3 Swap Decoding
  const uniV3Result = registry.decodeTransaction('0xe592427a0aece92de3edee1f18e0157c05861564', {
    tokenIn: '0xc02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    tokenOut: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    amountIn: '2000000000000000000',
    amountOut: '6000000000'
  });

  if (uniV3Result.actionType !== 'SWAP' || uniV3Result.dexId !== 'UNISWAP_V3') {
    throw new Error('Test Failed: Uniswap V3 decoder invalid');
  }
  console.log('  ✓ Uniswap V3 EVM decoder passed');

  console.log('✅ All Blockchain Decoder Tests Passed!');
}

if (process.argv[1]?.endsWith('pipeline.test.js') || process.argv[1]?.endsWith('pipeline.test.ts')) {
  runBlockchainTests().catch((err) => {
    console.error('❌ Blockchain Tests Failed:', err);
    process.exit(1);
  });
}
