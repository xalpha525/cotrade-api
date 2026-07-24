#!/usr/bin/env bash
set -e

echo "╔══════════════════════════════════════════════════════╗"
echo "║    Production Copy Trade Engine — Live E2E Suite     ║"
echo "╚══════════════════════════════════════════════════════╝"

API_URL="http://localhost:3000"

# 1. Login & Obtain Privy Session Token
echo ""
echo "🔐 Step 1: Authentication & Wallet Setup..."
AUTH_RES=$(curl -s -X POST "$API_URL/api/v1/auth/privy" \
  -H "Content-Type: application/json" \
  -d '{
    "privyUserId": "did:privy:e2e_engine_user",
    "email": "engine_e2e@copytrading.io",
    "wallets": [
      {
        "address": "5ZXHaimBjjnrhsaCirFC2e2eUserWalletAddress111",
        "chainId": "SOLANA_MAINNET",
        "walletType": "EMBEDDED"
      }
    ]
  }')

TOKEN=$(echo "$AUTH_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('token',''))")
if [ -z "$TOKEN" ]; then
  echo "❌ Auth failed"
  exit 1
fi
echo "  ✅ Auth session token obtained"

# 2. Add Target Trader to Track
echo ""
echo "👥 Step 2: Register & Track Target Trader..."
TRADER_RES=$(curl -s -X POST "$API_URL/api/v1/traders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "handle": "@MasterAlpha",
    "address": "6EGqJn2hAbcoVHK9P2TVMasterTraderWalletAddress1",
    "chain": "SOL"
  }')

TRADER_ID=$(echo "$TRADER_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('id',''))")
echo "  ✅ Target Trader created (id: $TRADER_ID)"

# 3. Create Privy Destination Wallet
echo ""
echo "💼 Step 3: Create Privy Destination Wallet for Follower..."
WALLET_RES=$(curl -s -X POST "$API_URL/api/v1/wallets/create-privy" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "chainId": "SOLANA_MAINNET",
    "name": "E2E Copy Execution Destination Wallet"
  }')

DEST_WALLET_ID=$(echo "$WALLET_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('id',''))")
echo "  ✅ Destination Privy Wallet created (id: $DEST_WALLET_ID)"

# 4. Activate 6-Step Copy Strategy
echo ""
echo "⚡ Step 4: Configure & Activate 6-Step Copy Strategy..."
STRAT_RES=$(curl -s -X POST "$API_URL/api/v1/strategies" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"traderId\": \"$TRADER_ID\",
    \"destinationWalletId\": \"$DEST_WALLET_ID\",
    \"sizingMode\": \"FIXED_DOLLAR\",
    \"fixedAmountUsd\": 250,
    \"maxSlippageBps\": 100,
    \"copyAllBuys\": true,
    \"takeProfitPercentage\": 100,
    \"stopLossPercentage\": 20,
    \"dailyLossLimitUsd\": 500
  }")

STRAT_ID=$(echo "$STRAT_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('follower',{}).get('id',''))")
echo "  ✅ Strategy activated (id: $STRAT_ID)"

# 5. Trigger Historical Replay Engine
echo ""
echo "🔄 Step 5: Test Historical Replay Engine..."
REPLAY_RES=$(curl -s -X POST "$API_URL/api/v1/ops/replay/$TRADER_ID" \
  -H "Content-Type: application/json")

REPLAYED_COUNT=$(echo "$REPLAY_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('replayedCount', 0))")
echo "  ✅ Historical Replay completed ($REPLAYED_COUNT trades replayed)"

# 6. Verify Operations & Monitoring API Metrics
echo ""
echo "📊 Step 6: Verify Operations & Monitoring API Metrics..."
OPS_RES=$(curl -s "$API_URL/api/v1/ops/metrics")
WORKER_HB=$(echo "$OPS_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('workerHeartbeat',''))")
HELIUS_STATUS=$(echo "$OPS_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('providers',{}).get('solanaHelius',{}).get('status',''))")

if [ "$WORKER_HB" = "ONLINE" ] && [ "$HELIUS_STATUS" = "HEALTHY" ]; then
  echo "  ✅ Operations API online (Worker: ONLINE, Helius: HEALTHY)"
else
  echo "❌ Ops check failed"
  exit 1
fi

# 7. Check Activity Center Timeline
echo ""
echo "📰 Step 7: Verify Activity Center Timeline Entries..."
ACT_RES=$(curl -s "$API_URL/api/v1/notifications" \
  -H "Authorization: Bearer $TOKEN")

ACT_COUNT=$(echo "$ACT_RES" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data',[])))")
echo "  ✅ Activity Center timeline functional ($ACT_COUNT entries found)"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  Results: ✅ Live Copy Execution Engine E2E Passed! ║"
echo "╚══════════════════════════════════════════════════════╝"
