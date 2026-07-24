#!/bin/bash
# CopyTrading Platform — Quick Smoke Test
# Usage: chmod +x scripts/smoke-test.sh && ./scripts/smoke-test.sh
set -e

BASE="http://localhost:3000"
PASS=0
FAIL=0
SKIP=0

pass() { echo "  ✅ $1"; ((PASS++)) || true; }
fail() { echo "  ❌ $1 — $2"; ((FAIL++)) || true; }
skip() { echo "  ⚠️  $1 (skipped: $2)"; ((SKIP++)) || true; }

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║      CopyTrading Platform — E2E Smoke Test           ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ─── 1. Infrastructure ─────────────────────────────────────
echo "📡 Section 1: Infrastructure"

HEALTH=$(curl -sf $BASE/health 2>/dev/null || echo "FAIL")
if echo "$HEALTH" | grep -q '"success":true'; then
  DB_STATUS=$(echo "$HEALTH" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']['services']; print(d['database']['status'])" 2>/dev/null || echo "unknown")
  REDIS_STATUS=$(echo "$HEALTH" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']['services']; print(d['redis']['status'])" 2>/dev/null || echo "unknown")
  QUEUE_STATUS=$(echo "$HEALTH" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']['services']; print(d['queue']['status'])" 2>/dev/null || echo "unknown")
  pass "API server healthy (DB: $DB_STATUS, Redis: $REDIS_STATUS, Queue: $QUEUE_STATUS)"
else
  fail "API server health check" "Not responding on $BASE"
fi

METRO=$(curl -sf http://localhost:8081/status 2>/dev/null || echo "FAIL")
if echo "$METRO" | grep -q "running"; then
  pass "Metro bundler running"
else
  fail "Metro bundler" "Not running on :8081"
fi

echo ""
echo "🔐 Section 2: Authentication"

# ─── 2. Auth ──────────────────────────────────────────────
# Retry up to 3 times to handle API warm-up period
TOKEN=""
for attempt in 1 2 3; do
  AUTH_RESP=$(curl -s -X POST $BASE/api/v1/auth/privy \
    -H "Content-Type: application/json" \
    -d '{"privyId":"did:privy:smoke_test","email":"smoke@test.com","token":"smoke_t","wallets":[]}' \
    2>/dev/null)

  if echo "$AUTH_RESP" | grep -q '"success":true'; then
    TOKEN=$(echo "$AUTH_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null || echo "")
    if [ -n "$TOKEN" ]; then
      pass "Privy login returns session token (attempt $attempt)"
      break
    fi
  fi
  [ $attempt -lt 3 ] && sleep 2
done

if [ -z "$TOKEN" ]; then
  fail "Privy login" "No token after 3 attempts — response: $(echo $AUTH_RESP | head -c 150)"
fi

# Auth middleware test — must return 401 without token
if [ -n "$TOKEN" ]; then
  UNAUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/wallets 2>/dev/null)
  if [ "$UNAUTH_STATUS" = "401" ]; then
    pass "Unauthenticated request rejected (HTTP 401)"
  else
    fail "Auth middleware" "Expected 401, got HTTP $UNAUTH_STATUS"
  fi
fi

echo ""
echo "💼 Section 3: Wallet Management"

# ─── 3. Wallets ──────────────────────────────────────────
if [ -n "$TOKEN" ]; then
  WALLETS_RESP=$(curl -sf -H "Authorization: Bearer $TOKEN" $BASE/api/v1/wallets 2>/dev/null || echo "FAIL")
  if echo "$WALLETS_RESP" | grep -q '"success":true'; then
    pass "GET /wallets returns 200"
  else
    fail "GET /wallets" "Request failed"
  fi

  CREATE_RESP=$(curl -sf -X POST $BASE/api/v1/wallets/create-privy \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"chainId":"SOLANA_MAINNET","name":"Smoke Test SOL Wallet"}' \
    2>/dev/null || echo "FAIL")

  if echo "$CREATE_RESP" | grep -q '"success":true'; then
    WALLET_ID=$(echo "$CREATE_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "")
    WALLET_ADDR=$(echo "$CREATE_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['address'][:20])" 2>/dev/null || echo "")
    pass "Create Solana wallet (id: ${WALLET_ID:0:8}..., addr: $WALLET_ADDR...)"
  else
    fail "Create Solana wallet" "$(echo $CREATE_RESP | head -c 200)"
    WALLET_ID=""
  fi

  CREATE_EVM=$(curl -sf -X POST $BASE/api/v1/wallets/create-privy \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"chainId":"ROBINHOOD_MAINNET","name":"Smoke Test EVM Wallet"}' \
    2>/dev/null || echo "FAIL")

  if echo "$CREATE_EVM" | grep -q '"success":true'; then
    EVM_ADDR=$(echo "$CREATE_EVM" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['address'][:6])" 2>/dev/null || echo "")
    pass "Create EVM wallet (addr starts with $EVM_ADDR...)"
  else
    fail "Create EVM wallet" "$(echo $CREATE_EVM | head -c 200)"
  fi

  if [ -n "$WALLET_ID" ]; then
    sleep 3
    BAL_RESP=$(curl -sf -H "Authorization: Bearer $TOKEN" $BASE/api/v1/wallets/$WALLET_ID/balance 2>/dev/null || echo "FAIL")
    if echo "$BAL_RESP" | grep -q '"success":true'; then
      BAL=$(echo "$BAL_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d.get('balanceUsd',0))" 2>/dev/null || echo "unknown")
      pass "GET /wallets/:id/balance (balanceUsd: $BAL)"
    else
      fail "GET /wallets/:id/balance" "Request failed"
    fi
  fi
else
  skip "Wallet tests" "No auth token"
fi

echo ""
echo "📊 Section 4: Portfolio & Statistics"

if [ -n "$TOKEN" ]; then
  PORT_RESP=$(curl -sf -H "Authorization: Bearer $TOKEN" $BASE/api/v1/portfolio 2>/dev/null || echo "FAIL")
  if echo "$PORT_RESP" | grep -q '"success":true'; then
    pass "GET /portfolio returns data"
  else
    fail "GET /portfolio" "Request failed"
  fi

  POS_RESP=$(curl -sf -H "Authorization: Bearer $TOKEN" $BASE/api/v1/portfolio/positions 2>/dev/null || echo "FAIL")
  if echo "$POS_RESP" | grep -q '"success":true'; then
    pass "GET /portfolio/positions returns data"
  else
    fail "GET /portfolio/positions" "Request failed"
  fi

  STATS_RESP=$(curl -sf -H "Authorization: Bearer $TOKEN" $BASE/api/v1/portfolio/stats 2>/dev/null || echo "FAIL")
  if echo "$STATS_RESP" | grep -q '"success":true'; then
    WIN_RATE=$(echo "$STATS_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'].get('winRate',0))" 2>/dev/null || echo "unknown")
    pass "GET /portfolio/stats (winRate: $WIN_RATE%)"
  else
    fail "GET /portfolio/stats" "Request failed"
  fi
fi

echo ""
echo "👥 Section 5: Traders API"

TRADERS_RESP=$(curl -sf "$BASE/api/v1/traders?page=1&pageSize=5" 2>/dev/null || echo "FAIL")
if echo "$TRADERS_RESP" | grep -q '"success":true'; then
  TRADER_COUNT=$(echo "$TRADERS_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data',[])))" 2>/dev/null || echo "unknown")
  pass "GET /traders (count: $TRADER_COUNT)"
else
  fail "GET /traders" "Request failed"
fi

ADD_TRADER=$(curl -sf -X POST $BASE/api/v1/traders \
  -H "Content-Type: application/json" \
  -d "{\"address\":\"SmokeTrader$(date +%s)\",\"handle\":\"smoke_trader_$(date +%s)\",\"chain\":\"SOL\"}" \
  2>/dev/null || echo "FAIL")
if echo "$ADD_TRADER" | grep -q '"success":true'; then
  pass "POST /traders creates trader"
else
  fail "POST /traders" "$(echo $ADD_TRADER | head -c 100)"
fi

echo ""
echo "🏗️  Section 6: Build Integrity"

for pkg in db events queue blockchain api; do
  BUILD=$(cd /Users/rag/Documents/workspace/copytrading/CopyTrading && pnpm --filter @copytrading/$pkg build 2>&1)
  if echo "$BUILD" | grep -qE "error TS|ERR_PNPM"; then
    fail "@copytrading/$pkg build" "TypeScript errors found"
  else
    pass "@copytrading/$pkg builds cleanly"
  fi
done

echo ""
echo "📦 Section 7: Metro Bundle"

BUNDLE_SIZE=$(curl -sf -o /dev/null -w "%{size_download}" \
  "http://localhost:8081/index.bundle?platform=ios&dev=true&minify=false" 2>/dev/null || echo "0")
if [ "$BUNDLE_SIZE" -gt 5000000 ] 2>/dev/null; then
  pass "Metro bundle served (${BUNDLE_SIZE} bytes)"
else
  fail "Metro bundle" "Size too small or not served (got: $BUNDLE_SIZE bytes)"
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
printf "║  Results: ✅ %2d passed  ❌ %2d failed  ⚠️  %2d skipped  ║\n" $PASS $FAIL $SKIP
echo "╚══════════════════════════════════════════════════════╝"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "🔴 Platform NOT ready — fix failures before proceeding."
  exit 1
else
  echo "🟢 Platform smoke test PASSED — safe to continue development."
  exit 0
fi
