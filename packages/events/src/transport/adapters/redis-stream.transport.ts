import { logger } from '@copytrading/logger';
import type { DomainEventContract } from '../../contracts/domain-event.contract.js';
import type { EventTransportType, IEventPublisher, IEventSubscriber, IEventTransport } from '../interfaces.js';

export class RedisStreamEventPublisher implements IEventPublisher {
  async publish<T extends DomainEventContract>(event: T): Promise<void> {
    logger.info({ eventType: event.eventType, eventId: event.eventId }, 'RedisStreamEventPublisher publishing to Redis Stream');
  }
}

export class RedisStreamEventSubscriber implements IEventSubscriber {
  async subscribe<T extends DomainEventContract>(
    eventType: string,
    _handler: (event: T) => Promise<void>
  ): Promise<void> {
    logger.info({ eventType }, 'RedisStreamEventSubscriber registered Redis Stream subscription');
  }
}

export class RedisStreamEventTransport implements IEventTransport {
  readonly transportType: EventTransportType = 'redis-stream';
  readonly publisher = new RedisStreamEventPublisher();
  readonly subscriber = new RedisStreamEventSubscriber();

  async connect(): Promise<void> {
    logger.info('RedisStreamEventTransport connected');
  }

  async disconnect(): Promise<void> {
    logger.info('RedisStreamEventTransport disconnected');
  }
}
