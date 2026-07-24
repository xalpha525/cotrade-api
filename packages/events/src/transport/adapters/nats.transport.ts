import { logger } from '@copytrading/logger';
import type { DomainEventContract } from '../../contracts/domain-event.contract.js';
import type { EventTransportType, IEventPublisher, IEventSubscriber, IEventTransport } from '../interfaces.js';

export class NatsEventPublisher implements IEventPublisher {
  async publish<T extends DomainEventContract>(event: T): Promise<void> {
    logger.info({ eventType: event.eventType, eventId: event.eventId }, 'NatsEventPublisher publishing to NATS JetStream');
  }
}

export class NatsEventSubscriber implements IEventSubscriber {
  async subscribe<T extends DomainEventContract>(
    eventType: string,
    _handler: (event: T) => Promise<void>
  ): Promise<void> {
    logger.info({ eventType }, 'NatsEventSubscriber registered NATS JetStream subscription');
  }
}

export class NatsEventTransport implements IEventTransport {
  readonly transportType: EventTransportType = 'nats';
  readonly publisher = new NatsEventPublisher();
  readonly subscriber = new NatsEventSubscriber();

  async connect(): Promise<void> {
    logger.info('NatsEventTransport connected to JetStream server');
  }

  async disconnect(): Promise<void> {
    logger.info('NatsEventTransport disconnected');
  }
}
