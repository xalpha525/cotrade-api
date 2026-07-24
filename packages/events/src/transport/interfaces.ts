import type { DomainEventContract } from '../contracts/domain-event.contract.js';

export type EventTransportType = 'in-memory' | 'redis-stream' | 'kafka' | 'nats';

export interface IEventPublisher {
  publish<T extends DomainEventContract>(event: T): Promise<void>;
}

export interface IEventSubscriber {
  subscribe<T extends DomainEventContract>(
    eventType: string,
    handler: (event: T) => Promise<void>
  ): Promise<void>;
}

export interface IEventTransport {
  readonly transportType: EventTransportType;
  readonly publisher: IEventPublisher;
  readonly subscriber: IEventSubscriber;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
