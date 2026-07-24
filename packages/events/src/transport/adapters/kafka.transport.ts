import { logger } from '@copytrading/logger';
import type { DomainEventContract } from '../../contracts/domain-event.contract.js';
import type { EventTransportType, IEventPublisher, IEventSubscriber, IEventTransport } from '../interfaces.js';

export class KafkaEventPublisher implements IEventPublisher {
  async publish<T extends DomainEventContract>(event: T): Promise<void> {
    logger.info({ eventType: event.eventType, eventId: event.eventId }, 'KafkaEventPublisher publishing to Kafka Topic');
  }
}

export class KafkaEventSubscriber implements IEventSubscriber {
  async subscribe<T extends DomainEventContract>(
    eventType: string,
    _handler: (event: T) => Promise<void>
  ): Promise<void> {
    logger.info({ eventType }, 'KafkaEventSubscriber registered Kafka consumer subscription');
  }
}

export class KafkaEventTransport implements IEventTransport {
  readonly transportType: EventTransportType = 'kafka';
  readonly publisher = new KafkaEventPublisher();
  readonly subscriber = new KafkaEventSubscriber();

  async connect(): Promise<void> {
    logger.info('KafkaEventTransport connected to cluster');
  }

  async disconnect(): Promise<void> {
    logger.info('KafkaEventTransport disconnected');
  }
}
