import type { DomainEventContract } from '../contracts/domain-event.contract.js';
import { EventRegistry, EventSerializer } from '../registry/event-registry.js';
import { EventTransportFactory } from '../transport/transport-factory.js';

export async function runEventTransportTests(): Promise<void> {
  console.log('🧪 Running Event Transport Layer Tests...');

  // Test 1: InMemory Transport Publishing & Subscribing
  const inMemoryTransport = EventTransportFactory.getTransport('in-memory');
  await inMemoryTransport.connect();

  let eventReceived = false;
  await inMemoryTransport.subscriber.subscribe('TEST_EVENT', async (evt) => {
    if (evt.eventId === 'evt_test_100') {
      eventReceived = true;
    }
  });

  const mockContract: DomainEventContract = {
    eventId: 'evt_test_100',
    eventType: 'TEST_EVENT',
    aggregateId: 'agg_01',
    aggregateType: 'Order',
    version: 1,
    timestamp: Date.now(),
    correlationId: 'corr_01',
    requestId: 'req_01',
    source: 'test-suite',
    metadata: {},
    payload: { amount: 100 }
  };

  await inMemoryTransport.publisher.publish(mockContract);
  if (!eventReceived) {
    throw new Error('Test Failed: InMemory subscriber did not receive published event');
  }
  console.log('  ✓ InMemory Transport publish & subscribe passed');

  // Test 2: Transport Swapping (Redis, Kafka, NATS)
  const redisTransport = EventTransportFactory.getTransport('redis-stream');
  const kafkaTransport = EventTransportFactory.getTransport('kafka');
  const natsTransport = EventTransportFactory.getTransport('nats');

  if (
    redisTransport.transportType !== 'redis-stream' ||
    kafkaTransport.transportType !== 'kafka' ||
    natsTransport.transportType !== 'nats'
  ) {
    throw new Error('Test Failed: Transport swapping failed');
  }
  console.log('  ✓ Transport swapping (InMemory -> Redis -> Kafka -> NATS) passed');

  // Test 3: Serialization & Deserialization
  const serialized = EventSerializer.serialize(mockContract);
  const deserialized = EventSerializer.deserialize(serialized);
  if (deserialized.eventId !== mockContract.eventId) {
    throw new Error('Test Failed: Serializer output mismatch');
  }
  console.log('  ✓ Event serialization & deserialization passed');

  // Test 4: Registry Versioning
  EventRegistry.register('TEST_EVENT', 2);
  if (EventRegistry.getVersion('TEST_EVENT') !== 2) {
    throw new Error('Test Failed: EventRegistry version lookup failed');
  }
  console.log('  ✓ EventRegistry versioning passed');

  await inMemoryTransport.disconnect();
  console.log('✅ All Event Transport Tests Passed!');
}

if (process.argv[1]?.endsWith('transport.test.js') || process.argv[1]?.endsWith('transport.test.ts')) {
  runEventTransportTests().catch((err) => {
    console.error('❌ Event Transport Tests Failed:', err);
    process.exit(1);
  });
}
