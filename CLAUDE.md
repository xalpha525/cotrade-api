# CLAUDE.md - CopyTrading Development Guide

## Project Overview
CopyTrading is a platform designed to replicate trading strategies across multiple exchange and broker accounts in real-time, enforcing strict risk management, position sizing, and low-latency order execution.

---

## Technical Stack & Standards
- **Runtime / Framework:** Node.js / TypeScript (or Next.js / Python depending on component)
- **Database:** PostgreSQL (Primary), Redis (Caching & Job Queues)
- **API Protocols:** REST, WebSockets, FIX Protocol, Webhooks
- **Code Style:** Strict TypeScript, ES Modules, async/await patterns, functional & object-oriented balance

---

## Key Development Rules & Guidelines

1. **Security & API Keys**
   - **NEVER** commit secrets, API keys, or private environment variables to git.
   - Always store sensitive trade credentials encrypted at rest.
   - Use `.env.local` for local secrets and testnet credentials.

2. **Order Execution & Risk Management**
   - All trade executions MUST pass through risk validation prior to submission (e.g., max position size, max slippage, stop-loss checks).
   - Ensure idempotent order handling to avoid duplicate trade placement during network retries.

3. **Latency & Concurrency**
   - Optimize WebSocket event handlers to maintain real-time order synchronization.
   - Use asynchronous queues (e.g., BullMQ / Redis) for non-blocking order dispatching.

4. **Error Handling & Logging**
   - Wrap exchange API interactions in explicit try-catch blocks with descriptive error logs.
   - Never expose raw API secrets in logs or stack traces.

---

## Workspace Setup & Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run test suite
npm test

# Lint & Format
npm run lint
npm run format

# Database migrations
npm run db:migrate
```

---

## File Structure Guidelines
- `src/config/` - Environment & exchange configuration settings.
- `src/services/` - Core logic for copy trading engine, broker connectors, and risk manager.
- `src/api/` - REST API endpoints and WebSocket gateway.
- `src/utils/` - Shared helper utilities, logger, and math operations.
