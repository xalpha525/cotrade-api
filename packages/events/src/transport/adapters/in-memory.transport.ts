import { logger } from '@copytrading/logger';
import type { DomainEventContract } from '../../contracts/domain-event.contract.js';
import type { EventTransportType, IEventPublisher, IEventSubscriber, IEventTransport } from '../interfaces.js';

export class InMemoryEventPublisher implements IEventPublisher {
  constructor(private readonly bus: Map<string, Array<(event: any) => Promise<void>>>) {}

  async publish<T extends DomainEventContract>(event: T): Promise<void> {
    const handlers = this.bus.get(event.eventType) ?? [];
    logger.info({ eventType: event.eventType, eventId: event.eventId, handlerCount: handlers.length }, 'InMemoryEventPublisher publishing');
    for (const h of handlers) {
      await h(event);
    }
  }
}

export class InMemoryEventSubscriber implements IEventSubscriber {
  constructor(private readonly bus: Map<string, Array<(event: any) => Promise<void>>>) {}

  async subscribe<T extends DomainEventContract>(
    eventType: string,
    handler: (event: T) => Promise<void>
  ): Promise<void> {
    const handlers = this.bus.get(eventType) ?? [];
    handlers.push(handler as (event: any) => Promise<void>);
    this.bus.set(eventType, handlers);
    logger.info({ eventType }, 'InMemoryEventSubscriber registered subscription');
  }
}

export class InMemoryEventTransport implements IEventTransport {
  readonly transportType: EventTransportType = 'in-memory';
  private readonly bus = new Map<string, Array<(event: any) => Promise<void>>>();

  readonly publisher = new InMemoryEventPublisher(this.bus);
  readonly subscriber = new InMemoryEventSubscriber(this.bus);

  async connect(): Promise<void> {
    logger.info('InMemoryEventTransport connected');
  }

  async disconnect(): Promise<void> {
    logger.info('InMemoryEventTransport disconnected');
    this.bus.clear();
  }
}
