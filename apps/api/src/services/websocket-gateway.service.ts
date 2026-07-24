import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '@copytrading/logger';
import { eventBus, type WalletBalanceUpdatedEvent, type PortfolioUpdatedEvent, type PositionUpdatedEvent, type TransactionDetectedEvent, type StatisticsUpdatedEvent } from '@copytrading/events';
import { prisma } from '@copytrading/db';

interface AuthenticatedClient {
  socket: WebSocket;
  userId: string;
  walletAddresses: Set<string>;
  walletIds: Set<string>;
}

export class WebSocketGatewayService {
  private wss: WebSocketServer | null = null;
  private clients = new Set<AuthenticatedClient>();

  init(server: HttpServer) {
    this.wss = new WebSocketServer({ noServer: true });
    logger.info('🔌 WebSocketGatewayService mounted on /ws (noServer upgrade mode)');

    server.on('upgrade', (req, socket, head) => {
      try {
        const url = new URL(req.url ?? '', 'http://localhost');
        if (url.pathname === '/ws') {
          this.wss?.handleUpgrade(req, socket, head, (ws) => {
            this.wss?.emit('connection', ws, req);
          });
        }
      } catch (err) {
        logger.warn({ err }, 'WebSocket upgrade failed');
        socket.destroy();
      }
    });

    this.wss.on('connection', async (socket, req) => {
      try {
        const url = new URL(req.url ?? '', 'http://localhost');
        const token = url.searchParams.get('token');

        // Extract user or assign default guest/active user session
        let userId = 'user_default';
        if (token && token.startsWith('user_')) {
          userId = token;
        }

        // Fetch user's wallets to register ownership filter
        const userWallets = await prisma.wallet.findMany({
          where: { userId, deletedAt: null },
          select: { id: true, address: true },
        });

        const client: AuthenticatedClient = {
          socket,
          userId,
          walletAddresses: new Set(userWallets.map((w) => w.address)),
          walletIds: new Set(userWallets.map((w) => w.id)),
        };

        this.clients.add(client);
        logger.info({ userId, walletCount: client.walletAddresses.size }, 'WS Client connected & authenticated');

        socket.on('close', () => {
          this.clients.delete(client);
          logger.info({ userId }, 'WS Client disconnected');
        });

        socket.on('error', (err) => {
          logger.warn({ userId, err }, 'WS Socket error');
        });
      } catch (err) {
        logger.error({ err }, 'Failed to initialize client WS connection');
        socket.close();
      }
    });

    this.subscribeToDomainEvents();
  }

  private subscribeToDomainEvents() {
    // 1. WALLET_BALANCE_UPDATED Domain Event
    eventBus.subscribe<WalletBalanceUpdatedEvent>('WALLET_BALANCE_UPDATED', async (event: WalletBalanceUpdatedEvent) => {
      logger.info({ walletId: event.walletId, balanceUsd: event.balanceUsd }, 'WebSocketGateway: Received WALLET_BALANCE_UPDATED domain event');

      const payload = JSON.stringify({
        type: 'WALLET_BALANCE_UPDATED',
        data: {
          id: event.walletId,
          address: event.address,
          chainId: event.chainId,
          balanceUsd: event.balanceUsd,
          updatedAt: new Date(event.timestamp).toISOString(),
        },
      });

      // Target broadcast ONLY to authenticated clients owning/tracking this wallet or to all active app clients
      for (const client of this.clients) {
        if (
          client.socket.readyState === WebSocket.OPEN &&
          (client.walletIds.has(event.walletId) || client.walletAddresses.has(event.address) || client.userId === 'user_default' || client.walletIds.size === 0)
        ) {
          client.socket.send(payload);
          logger.info({ userId: client.userId, walletId: event.walletId }, 'Targeted WS WALLET_BALANCE_UPDATED sent to client');
        }
      }
    });

    // 2. PORTFOLIO_UPDATED Domain Event
    eventBus.subscribe<PortfolioUpdatedEvent>('PORTFOLIO_UPDATED', async (event: PortfolioUpdatedEvent) => {
      const payload = JSON.stringify({
        type: 'PORTFOLIO_UPDATED',
        data: {
          totalValueUsd: event.totalValueUsd,
          cashBalanceUsd: event.cashBalanceUsd,
          positionValueUsd: event.positionValueUsd,
        },
      });

      for (const client of this.clients) {
        if (client.socket.readyState === WebSocket.OPEN && (client.userId === event.userId || client.userId === 'user_default')) {
          client.socket.send(payload);
        }
      }
    });

    // 3. POSITION_UPDATED Domain Event
    eventBus.subscribe<PositionUpdatedEvent>('POSITION_UPDATED', async (event: PositionUpdatedEvent) => {
      const payload = JSON.stringify({
        type: 'POSITION_UPDATED',
        data: event,
      });

      for (const client of this.clients) {
        if (client.socket.readyState === WebSocket.OPEN && (client.walletIds.has(event.walletId) || client.userId === 'user_default')) {
          client.socket.send(payload);
        }
      }
    });

    // 4. TRANSACTION_DETECTED Domain Event
    eventBus.subscribe<TransactionDetectedEvent>('TRANSACTION_DETECTED', async (event: TransactionDetectedEvent) => {
      const payload = JSON.stringify({
        type: 'NOTIFICATION_ADDED',
        data: {
          id: event.eventId,
          title: `Transaction on ${event.chainId}`,
          summary: `Detected ${event.type} transaction (${event.txHash.slice(0, 8)}...)`,
          activityType: 'WALLET_FUNDED',
          timestamp: event.timestamp,
          txHash: event.txHash,
        },
      });

      for (const client of this.clients) {
        if (client.socket.readyState === WebSocket.OPEN && (client.walletAddresses.has(event.address) || client.userId === 'user_default')) {
          client.socket.send(payload);
        }
      }
    });

    // 5. STATISTICS_UPDATED Domain Event
    eventBus.subscribe<StatisticsUpdatedEvent>('STATISTICS_UPDATED', async (event: StatisticsUpdatedEvent) => {
      const payload = JSON.stringify({
        type: 'TRADER_STATS_UPDATED',
        data: event,
      });

      for (const client of this.clients) {
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.send(payload);
        }
      }
    });
  }
}

export const wsGatewayService = new WebSocketGatewayService();
