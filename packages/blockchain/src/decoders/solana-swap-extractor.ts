const NATIVE_SOL = 'So11111111111111111111111111111111111111112';

export interface ExtractedSwapData {
  tokenInAddress: string;
  tokenOutAddress: string;
  amountIn: string;
  amountOut: string;
}

export function extractSolanaSwapData(
  rawPayload: Record<string, unknown>,
  walletAddress?: string
): ExtractedSwapData | null {
  // 1. Direct payload check (pre-parsed payload)
  const tokenIn = (rawPayload['tokenIn'] as string) || (rawPayload['mintIn'] as string);
  const tokenOut = (rawPayload['tokenOut'] as string) || (rawPayload['mintOut'] as string);
  const amountIn = (rawPayload['amountIn'] as string) || (rawPayload['inAmount'] as string);
  const amountOut = (rawPayload['amountOut'] as string) || (rawPayload['outAmount'] as string);

  if (tokenIn && tokenOut && amountIn && amountOut) {
    return { tokenInAddress: tokenIn, tokenOutAddress: tokenOut, amountIn, amountOut };
  }

  // 2. Standard Solana RPC getTransaction jsonParsed payload extraction
  const meta = rawPayload['meta'] as Record<string, unknown> | undefined;
  if (!meta) return null;

  const preTokenBalances = (meta['preTokenBalances'] as Array<Record<string, unknown>>) || [];
  const postTokenBalances = (meta['postTokenBalances'] as Array<Record<string, unknown>>) || [];

  // Track balance changes per mint address
  const netChanges = new Map<string, number>();

  for (const pre of preTokenBalances) {
    const mint = pre['mint'] as string;
    const owner = pre['owner'] as string;
    const uiAmount = (pre['uiTokenAmount'] as Record<string, unknown>)?.['uiAmount'] as number || 0;
    if (walletAddress && owner !== walletAddress) continue;
    netChanges.set(mint, (netChanges.get(mint) ?? 0) - uiAmount);
  }

  for (const post of postTokenBalances) {
    const mint = post['mint'] as string;
    const owner = post['owner'] as string;
    const uiAmount = (post['uiTokenAmount'] as Record<string, unknown>)?.['uiAmount'] as number || 0;
    if (walletAddress && owner !== walletAddress) continue;
    netChanges.set(mint, (netChanges.get(mint) ?? 0) + uiAmount);
  }

  let inMint: string | null = null;
  let outMint: string | null = null;
  let inAmt = 0;
  let outAmt = 0;

  for (const [mint, diff] of netChanges.entries()) {
    if (diff < 0 && Math.abs(diff) > inAmt) {
      inMint = mint;
      inAmt = Math.abs(diff);
    } else if (diff > 0 && diff > outAmt) {
      outMint = mint;
      outAmt = diff;
    }
  }

  // Handle native SOL balance changes if one token mint is missing
  const preBalances = (meta['preBalances'] as number[]) || [];
  const postBalances = (meta['postBalances'] as number[]) || [];
  const pre0 = preBalances[0];
  const post0 = postBalances[0];
  if (pre0 !== undefined && post0 !== undefined) {
    const solDiff = (post0 - pre0) / 1e9;
    if (solDiff < -0.001 && !inMint) {
      inMint = NATIVE_SOL;
      inAmt = Math.abs(solDiff);
    } else if (solDiff > 0.001 && !outMint) {
      outMint = NATIVE_SOL;
      outAmt = solDiff;
    }
  }

  if (inMint && outMint && inAmt > 0 && outAmt > 0) {
    return {
      tokenInAddress: inMint,
      tokenOutAddress: outMint,
      amountIn: inAmt.toString(),
      amountOut: outAmt.toString(),
    };
  }

  return null;
}
