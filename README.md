# CopyTrading Platform

A high-performance, real-time automated copy trading system designed to mirror trades from master trader accounts to multiple follower accounts across various cryptocurrency exchanges and brokerage platforms.

---

## Key Features

- ⚡ **Low-Latency Trade Replication**: Real-time trade copying via WebSockets and high-speed order execution engines.
- 🛡️ **Advanced Risk Management**: Customizable position sizing, leverage limits, max drawdown protection, and dynamic slippage control.
- 🔄 **Multi-Exchange & Broker Support**: Integrations for Binance, Bybit, MetaTrader, and REST/Webhook sources.
- 📊 **Performance Analytics**: Real-time dashboard tracking win rates, PnL, open positions, and latency metrics.
- 🔔 **Instant Alerts**: Telegram bot and webhook notifications for trade entries, exits, and risk alerts.

---

## Project Structure

```text
CopyTrading/
├── .env.local         # Local environment variables & secrets template
├── .gitignore         # Git ignore rules
├── CLAUDE.md          # AI assistant context & development standards
└── README.md          # Project documentation
```

---

## Getting Started

### Prerequisites

- **Node.js**: `v18.x` or higher
- **Package Manager**: `npm`, `yarn`, or `pnpm`
- **Database**: PostgreSQL & Redis (for queuing & caching)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd CopyTrading
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.local .env
   ```
   Edit `.env` to include your exchange API keys, database connection strings, and secret keys.

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start local development:**
   ```bash
   npm run dev
   ```

---

## Disclaimer

> **WARNING**: Trading financial instruments (cryptocurrencies, stocks, forex, derivatives) involves substantial risk of loss. This software is provided for educational and technical automation purposes only. Always test thoroughly in testnet/paper-trading environments before deploying real funds.
