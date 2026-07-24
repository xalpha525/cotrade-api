export interface DomainEventContract<TPayload = Record<string, unknown>> {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  version: number;
  timestamp: number;
  correlationId: string;
  requestId: string;
  source: string;
  metadata: Record<string, unknown>;
  payload: TPayload;
}
