import type { DomainEventContract } from '../contracts/domain-event.contract.js';

export class EventSerializer {
  static serialize<T extends DomainEventContract>(event: T): string {
    return JSON.stringify(event);
  }

  static deserialize<T extends DomainEventContract>(json: string): T {
    const parsed = JSON.parse(json) as T;
    if (!parsed.eventId || !parsed.eventType) {
      throw new Error('INVALID_EVENT_FORMAT: Missing required header fields');
    }
    return parsed;
  }
}

export class EventRegistry {
  private static registeredTypes = new Map<string, number>();

  static register(eventType: string, version = 1): void {
    this.registeredTypes.set(eventType, version);
  }

  static isRegistered(eventType: string): boolean {
    return this.registeredTypes.has(eventType);
  }

  static getVersion(eventType: string): number {
    return this.registeredTypes.get(eventType) ?? 1;
  }
}
