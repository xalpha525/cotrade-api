import { InMemoryEventTransport } from './adapters/in-memory.transport.js';
import { KafkaEventTransport } from './adapters/kafka.transport.js';
import { NatsEventTransport } from './adapters/nats.transport.js';
import { RedisStreamEventTransport } from './adapters/redis-stream.transport.js';
import type { EventTransportType, IEventTransport } from './interfaces.js';

export class EventTransportFactory {
  private static transports = new Map<EventTransportType, IEventTransport>();

  static getTransport(overrideType?: EventTransportType): IEventTransport {
    const transportType: EventTransportType =
      overrideType ?? (process.env['EVENT_TRANSPORT_TYPE'] as EventTransportType) ?? 'in-memory';

    let instance = this.transports.get(transportType);
    if (!instance) {
      switch (transportType) {
        case 'redis-stream':
          instance = new RedisStreamEventTransport();
          break;
        case 'kafka':
          instance = new KafkaEventTransport();
          break;
        case 'nats':
          instance = new NatsEventTransport();
          break;
        case 'in-memory':
        default:
          instance = new InMemoryEventTransport();
          break;
      }
      this.transports.set(transportType, instance);
    }

    return instance;
  }
}
